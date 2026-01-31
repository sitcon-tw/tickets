/**
 * Admin routes for webhook management
 */

import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { requireEventAccess } from "#middleware/auth";
import { webhookSchemas } from "#schemas";
import { conflictResponse, notFoundResponse, serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { getFailedDeliveries, retryFailedDelivery, testWebhookEndpoint } from "#utils/webhook";
import { SpanStatusCode } from "@opentelemetry/api";
import { WebhookEventTypeSchema } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

const webhooksRoutes: FastifyPluginAsync = async fastify => {
	/**
	 * Get webhook configuration for an event
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.getWebhook
		},
		async (request, reply) => {
			const { eventId } = request.params;
			const span = tracer.startSpan("route.admin.webhooks.get", {
				attributes: {
					"event.id": eventId
				}
			});

			try {
				span.addEvent("database.query.webhook");

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse(null, "No webhook configured"));
				}

				span.setAttribute("webhook.id", webhook.id);
				span.setAttribute("webhook.isActive", webhook.isActive);
				span.setAttribute("webhook.eventTypes.count", webhook.eventTypes.length);

				// Don't expose the auth header value in response
				const safeWebhook = {
					...webhook,
					eventTypes: z.array(WebhookEventTypeSchema).parse(webhook.eventTypes),
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt,
					updatedAt: webhook.updatedAt,
					lastFailureAt: webhook.lastFailureAt ?? null
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(safeWebhook));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get webhook"
				});
				request.log.error({ error }, "Get webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to get webhook");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Create webhook for an event
	 */
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.createWebhook
		},
		async (request, reply) => {
			const { eventId } = request.params;
			const { url, authHeaderName, authHeaderValue, eventTypes } = request.body;

			// Mask URL domain for security
			const maskedUrl = url.replace(/^(https?:\/\/[^/]+)(.*)$/, "$1/***");

			const span = tracer.startSpan("route.admin.webhooks.create", {
				attributes: {
					"event.id": eventId,
					"webhook.url.masked": maskedUrl,
					"webhook.eventTypes.count": eventTypes.length
				}
			});

			try {
				// Check if event exists
				span.addEvent("database.query.event");

				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("Event not found");
					return reply.code(statusCode).send(response);
				}

				// Check if webhook already exists
				span.addEvent("database.check.webhook_exists");

				const existing = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (existing) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = conflictResponse("Webhook already exists for this event");
					return reply.code(statusCode).send(response);
				}

				// Validate URL is HTTPS
				if (!url.startsWith("https://")) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				// Validate event types
				const eventTypesParseResult = z.array(WebhookEventTypeSchema).safeParse(eventTypes);
				if (!eventTypesParseResult.success) {
					span.setAttribute("validation.error", JSON.stringify(eventTypesParseResult.error.issues));
					span.setAttribute("validation.field", "eventTypes");
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Invalid event types", eventTypesParseResult.error.issues);
					return reply.code(statusCode).send(response);
				}

				// Create webhook
				span.addEvent("database.create.webhook");

				const webhook = await prisma.webhookEndpoint.create({
					data: {
						eventId,
						url,
						authHeaderName: authHeaderName || null,
						authHeaderValue: authHeaderValue || null,
						eventTypes: eventTypesParseResult.data,
						isActive: true
					}
				});

				span.setAttribute("webhook.id", webhook.id);

				const safeWebhook = {
					...webhook,
					eventTypes: eventTypesParseResult.data,
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt,
					updatedAt: webhook.updatedAt,
					lastFailureAt: null
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.code(201).send(successResponse(safeWebhook, "Webhook created"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to create webhook"
				});
				request.log.error({ error }, "Create webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to create webhook");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Update webhook for an event
	 */
	fastify.withTypeProvider<ZodTypeProvider>().put(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.updateWebhook
		},
		async (request, reply) => {
			const { eventId } = request.params;
			const { url, authHeaderName, authHeaderValue, eventTypes, isActive } = request.body;

			// Mask URL domain for security
			const maskedUrl = url ? url.replace(/^(https?:\/\/[^/]+)(.*)$/, "$1/***") : undefined;

			const span = tracer.startSpan("route.admin.webhooks.update", {
				attributes: {
					"event.id": eventId,
					"webhook.url.masked": maskedUrl || "unchanged"
				}
			});

			try {
				span.addEvent("database.query.webhook");

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("Webhook not found");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("webhook.id", webhook.id);

				// Validate URL if provided
				if (url && !url.startsWith("https://")) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				// Validate event types if provided
				const eventTypesParseResult = z.array(WebhookEventTypeSchema).safeParse(eventTypes);
				if (!eventTypesParseResult.success) {
					span.setAttribute("validation.error", JSON.stringify(eventTypesParseResult.error.issues));
					span.setAttribute("validation.field", "eventTypes");
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Invalid event types", eventTypesParseResult.error.issues);
					return reply.code(statusCode).send(response);
				}

				// Build update data
				const updateData: Record<string, any> = {};
				if (url !== undefined) updateData.url = url;
				if (authHeaderName !== undefined) updateData.authHeaderName = authHeaderName;
				if (authHeaderValue !== undefined) updateData.authHeaderValue = authHeaderValue;
				if (eventTypes !== undefined) updateData.eventTypes = eventTypes;
				if (isActive !== undefined) {
					updateData.isActive = isActive;
					// Reset failure tracking when manually toggling
					if (isActive) {
						updateData.consecutiveFailurePeriods = 0;
						updateData.lastFailureAt = null;
						span.addEvent("webhook.reset_failure_tracking");
					}
				}

				span.addEvent("database.update.webhook");

				const updatedWebhook = await prisma.webhookEndpoint.update({
					where: { id: webhook.id },
					data: updateData
				});

				const safeWebhook = {
					...updatedWebhook,
					eventTypes: eventTypesParseResult.data,
					authHeaderValue: updatedWebhook.authHeaderValue ? "********" : null,
					createdAt: updatedWebhook.createdAt,
					updatedAt: updatedWebhook.updatedAt,
					lastFailureAt: updatedWebhook.lastFailureAt ?? null
				};

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(safeWebhook, "Webhook updated"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to update webhook"
				});
				request.log.error({ error }, "Update webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to update webhook");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Delete webhook for an event
	 */
	fastify.withTypeProvider<ZodTypeProvider>().delete(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.deleteWebhook
		},
		async (request, reply) => {
			const { eventId } = request.params;
			const span = tracer.startSpan("route.admin.webhooks.delete", {
				attributes: {
					"event.id": eventId
				}
			});

			try {
				span.addEvent("database.query.webhook");

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = notFoundResponse("Webhook not found");
					return reply.code(statusCode).send(response);
				}

				span.setAttribute("webhook.id", webhook.id);

				span.addEvent("database.delete.webhook");

				await prisma.webhookEndpoint.delete({
					where: { id: webhook.id }
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(null, "Webhook deleted"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to delete webhook"
				});
				request.log.error({ error }, "Delete webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to delete webhook");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Test webhook URL
	 */
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/events/:eventId/webhook/test",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.testWebhook
		},
		async (request, reply) => {
			const { url, authHeaderName, authHeaderValue } = request.body;

			// Mask URL domain for security
			const maskedUrl = url.replace(/^(https?:\/\/[^/]+)(.*)$/, "$1/***");

			const span = tracer.startSpan("route.admin.webhooks.test", {
				attributes: {
					"event.id": request.params.eventId,
					"webhook.url.masked": maskedUrl
				}
			});

			try {
				// Validate URL is HTTPS
				if (!url.startsWith("https://")) {
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				span.addEvent("webhook.test.start");

				const result = await testWebhookEndpoint(url, authHeaderName, authHeaderValue);

				span.setAttribute("webhook.test.success", result.success);
				if (!result.success) {
					span.addEvent("webhook.test.failed", {
						"error.message": result.errorMessage || "Unknown error"
					});
				}

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(result, result.success ? "Webhook test successful" : "Webhook test failed"));
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to test webhook"
				});
				request.log.error({ error }, "Test webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to test webhook");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Get failed webhook deliveries for an event
	 */
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/events/:eventId/webhook/failed-deliveries",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.getFailedDeliveries
		},
		async (request, reply) => {
			const { eventId } = request.params;
			const { page = 1, limit = 20 } = request.query;

			const span = tracer.startSpan("route.admin.webhooks.getFailedDeliveries", {
				attributes: {
					"event.id": eventId,
					"pagination.page": page,
					"pagination.limit": limit
				}
			});

			try {
				span.addEvent("database.query.failed_deliveries");

				const { deliveries, total } = await getFailedDeliveries(eventId, page, limit);

				span.setAttribute("deliveries.total", total);
				span.setAttribute("deliveries.returned", deliveries.length);

				const serializedDeliveries = deliveries.map(d => ({
					...d,
					eventType: WebhookEventTypeSchema.parse(d.eventType),
					createdAt: d.createdAt,
					updatedAt: d.updatedAt,
					nextRetryAt: d.nextRetryAt ?? null
				}));

				const totalPages = Math.ceil(total / limit);

				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(
					successPaginatedResponse(serializedDeliveries, "Failed deliveries retrieved", {
						page,
						limit,
						total,
						totalPages,
						hasNext: page < totalPages,
						hasPrev: page > 1
					})
				);
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get failed deliveries"
				});
				request.log.error({ error }, "Get failed deliveries error");
				const { response, statusCode } = serverErrorResponse("Failed to get deliveries");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);

	/**
	 * Retry a failed webhook delivery
	 */
	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/events/:eventId/webhook/deliveries/:deliveryId/retry",
		{
			preHandler: [requireEventAccess],
			schema: webhookSchemas.retryDelivery
		},
		async (request, reply) => {
			const { eventId, deliveryId } = request.params;
			const span = tracer.startSpan("route.admin.webhooks.retryDelivery", {
				attributes: {
					"event.id": eventId,
					"delivery.id": deliveryId
				}
			});

			try {
				span.addEvent("webhook.retry.start");

				const success = await retryFailedDelivery(deliveryId);

				span.setAttribute("webhook.retry.success", success);

				if (success) {
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse(null, "Delivery retry successful"));
				} else {
					span.addEvent("webhook.retry.not_eligible");
					span.setStatus({ code: SpanStatusCode.OK });
					const { response, statusCode } = validationErrorResponse("Delivery retry failed or not eligible for retry");
					return reply.code(statusCode).send(response);
				}
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to retry delivery"
				});
				request.log.error({ error }, "Retry delivery error");
				const { response, statusCode } = serverErrorResponse("Failed to retry delivery");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default webhooksRoutes;
