/**
 * Admin routes for webhook management
 */

import prisma from "#config/database";
import { requireEventAccess } from "#middleware/auth";
import { webhookSchemas } from "#schemas";
import { conflictResponse, notFoundResponse, serverErrorResponse, successPaginatedResponse, successResponse, validationErrorResponse } from "#utils/response";
import { getFailedDeliveries, retryFailedDelivery, testWebhookEndpoint } from "#utils/webhook";
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
			try {
				const { eventId } = request.params;

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					return reply.send(successResponse(null, "No webhook configured"));
				}

				// Don't expose the auth header value in response
				const safeWebhook = {
					...webhook,
					eventTypes: z.array(WebhookEventTypeSchema).parse(webhook.eventTypes),
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt,
					updatedAt: webhook.updatedAt,
					lastFailureAt: webhook.lastFailureAt ?? null
				};

				return reply.send(successResponse(safeWebhook));
			} catch (error) {
				request.log.error({ error }, "Get webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to get webhook");
				return reply.code(statusCode).send(response);
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
			try {
				const { eventId } = request.params;
				const { url, authHeaderName, authHeaderValue, eventTypes } = request.body;

				// Check if event exists
				const event = await prisma.event.findUnique({
					where: { id: eventId }
				});

				if (!event) {
					const { response, statusCode } = notFoundResponse("Event not found");
					return reply.code(statusCode).send(response);
				}

				// Check if webhook already exists
				const existing = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (existing) {
					const { response, statusCode } = conflictResponse("Webhook already exists for this event");
					return reply.code(statusCode).send(response);
				}

				// Validate URL is HTTPS
				if (!url.startsWith("https://")) {
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				// Validate event types
				const eventTypesParseResult = z.array(WebhookEventTypeSchema).safeParse(eventTypes);
				if (!eventTypesParseResult.success) {
					const { response, statusCode } = validationErrorResponse("Invalid event types", eventTypesParseResult.error.issues);
					return reply.code(statusCode).send(response);
				}

				// Create webhook
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

				const safeWebhook = {
					...webhook,
					eventTypes: eventTypesParseResult.data,
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt,
					updatedAt: webhook.updatedAt,
					lastFailureAt: null
				};

				return reply.code(201).send(successResponse(safeWebhook, "Webhook created"));
			} catch (error) {
				request.log.error({ error }, "Create webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to create webhook");
				return reply.code(statusCode).send(response);
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
			try {
				const { eventId } = request.params;
				const { url, authHeaderName, authHeaderValue, eventTypes, isActive } = request.body;

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					const { response, statusCode } = notFoundResponse("Webhook not found");
					return reply.code(statusCode).send(response);
				}

				// Validate URL if provided
				if (url && !url.startsWith("https://")) {
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				// Validate event types if provided
				const eventTypesParseResult = z.array(WebhookEventTypeSchema).safeParse(eventTypes);
				if (!eventTypesParseResult.success) {
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
					}
				}

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

				return reply.send(successResponse(safeWebhook, "Webhook updated"));
			} catch (error) {
				request.log.error({ error }, "Update webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to update webhook");
				return reply.code(statusCode).send(response);
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
			try {
				const { eventId } = request.params;

				const webhook = await prisma.webhookEndpoint.findUnique({
					where: { eventId }
				});

				if (!webhook) {
					const { response, statusCode } = notFoundResponse("Webhook not found");
					return reply.code(statusCode).send(response);
				}

				await prisma.webhookEndpoint.delete({
					where: { id: webhook.id }
				});

				return reply.send(successResponse(null, "Webhook deleted"));
			} catch (error) {
				request.log.error({ error }, "Delete webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to delete webhook");
				return reply.code(statusCode).send(response);
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
			try {
				const { url, authHeaderName, authHeaderValue } = request.body;

				// Validate URL is HTTPS
				if (!url.startsWith("https://")) {
					const { response, statusCode } = validationErrorResponse("Webhook URL must use HTTPS");
					return reply.code(statusCode).send(response);
				}

				const result = await testWebhookEndpoint(url, authHeaderName, authHeaderValue);

				return reply.send(successResponse(result, result.success ? "Webhook test successful" : "Webhook test failed"));
			} catch (error) {
				request.log.error({ error }, "Test webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to test webhook");
				return reply.code(statusCode).send(response);
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
			try {
				const { eventId } = request.params;
				const { page = 1, limit = 20 } = request.query;

				const { deliveries, total } = await getFailedDeliveries(eventId, page, limit);

				const serializedDeliveries = deliveries.map(d => ({
					...d,
					eventType: WebhookEventTypeSchema.parse(d.eventType),
					createdAt: d.createdAt,
					updatedAt: d.updatedAt,
					nextRetryAt: d.nextRetryAt ?? null
				}));

				const totalPages = Math.ceil(total / limit);

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
				request.log.error({ error }, "Get failed deliveries error");
				const { response, statusCode } = serverErrorResponse("Failed to get deliveries");
				return reply.code(statusCode).send(response);
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
			try {
				const { deliveryId } = request.params;

				const success = await retryFailedDelivery(deliveryId);

				if (success) {
					return reply.send(successResponse(null, "Delivery retry successful"));
				} else {
					const { response, statusCode } = validationErrorResponse("Delivery retry failed or not eligible for retry");
					return reply.code(statusCode).send(response);
				}
			} catch (error) {
				request.log.error({ error }, "Retry delivery error");
				const { response, statusCode } = serverErrorResponse("Failed to retry delivery");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default webhooksRoutes;
