/**
 * Admin routes for webhook management
 */

import prisma from "#config/database";
import { requireEventAccess } from "#middleware/auth";
import { conflictResponse, notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { getFailedDeliveries, retryFailedDelivery, testWebhookEndpoint } from "#utils/webhook";
import type { WebhookEndpointCreateRequest, WebhookEndpointUpdateRequest, WebhookTestRequest } from "@sitcontix/types";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

interface EventIdParams {
	eventId: string;
}

interface DeliveryIdParams {
	eventId: string;
	deliveryId: string;
}

interface PaginationQuery {
	page?: string;
	limit?: string;
}

const webhooksRoutes: FastifyPluginAsync = async fastify => {
	/**
	 * Get webhook configuration for an event
	 */
	fastify.get<{
		Params: EventIdParams;
	}>(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Get webhook configuration for an event",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
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
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt.toISOString(),
					updatedAt: webhook.updatedAt.toISOString(),
					lastFailureAt: webhook.lastFailureAt?.toISOString() || null
				};

				return reply.send(successResponse(safeWebhook));
			} catch (error) {
				request.log.error({ err: error }, "Get webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to get webhook");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Create webhook for an event
	 */
	fastify.post<{
		Params: EventIdParams;
		Body: WebhookEndpointCreateRequest;
	}>(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Create webhook for an event",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams; Body: WebhookEndpointCreateRequest }>, reply: FastifyReply) => {
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
				const validEventTypes = ["registration_confirmed", "registration_cancelled"];
				const invalidTypes = eventTypes.filter(t => !validEventTypes.includes(t));
				if (invalidTypes.length > 0) {
					const { response, statusCode } = validationErrorResponse(`Invalid event types: ${invalidTypes.join(", ")}`);
					return reply.code(statusCode).send(response);
				}

				// Create webhook
				const webhook = await prisma.webhookEndpoint.create({
					data: {
						eventId,
						url,
						authHeaderName: authHeaderName || null,
						authHeaderValue: authHeaderValue || null,
						eventTypes,
						isActive: true
					}
				});

				const safeWebhook = {
					...webhook,
					authHeaderValue: webhook.authHeaderValue ? "********" : null,
					createdAt: webhook.createdAt.toISOString(),
					updatedAt: webhook.updatedAt.toISOString(),
					lastFailureAt: null
				};

				return reply.code(201).send(successResponse(safeWebhook, "Webhook created"));
			} catch (error) {
				request.log.error({ err: error }, "Create webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to create webhook");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Update webhook for an event
	 */
	fastify.put<{
		Params: EventIdParams;
		Body: WebhookEndpointUpdateRequest;
	}>(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Update webhook for an event",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams; Body: WebhookEndpointUpdateRequest }>, reply: FastifyReply) => {
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
				if (eventTypes) {
					const validEventTypes = ["registration_confirmed", "registration_cancelled"];
					const invalidTypes = eventTypes.filter(t => !validEventTypes.includes(t));
					if (invalidTypes.length > 0) {
						const { response, statusCode } = validationErrorResponse(`Invalid event types: ${invalidTypes.join(", ")}`);
						return reply.code(statusCode).send(response);
					}
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
					authHeaderValue: updatedWebhook.authHeaderValue ? "********" : null,
					createdAt: updatedWebhook.createdAt.toISOString(),
					updatedAt: updatedWebhook.updatedAt.toISOString(),
					lastFailureAt: updatedWebhook.lastFailureAt?.toISOString() || null
				};

				return reply.send(successResponse(safeWebhook, "Webhook updated"));
			} catch (error) {
				request.log.error({ err: error }, "Update webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to update webhook");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Delete webhook for an event
	 */
	fastify.delete<{
		Params: EventIdParams;
	}>(
		"/events/:eventId/webhook",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Delete webhook for an event",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams }>, reply: FastifyReply) => {
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
				request.log.error({ err: error }, "Delete webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to delete webhook");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Test webhook URL
	 */
	fastify.post<{
		Params: EventIdParams;
		Body: WebhookTestRequest;
	}>(
		"/events/:eventId/webhook/test",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Test webhook URL connectivity",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams; Body: WebhookTestRequest }>, reply: FastifyReply) => {
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
				request.log.error({ err: error }, "Test webhook error");
				const { response, statusCode } = serverErrorResponse("Failed to test webhook");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Get failed webhook deliveries for an event
	 */
	fastify.get<{
		Params: EventIdParams;
		Querystring: PaginationQuery;
	}>(
		"/events/:eventId/webhook/failed-deliveries",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Get failed webhook deliveries",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: EventIdParams; Querystring: PaginationQuery }>, reply: FastifyReply) => {
			try {
				const { eventId } = request.params;
				const query = request.query as PaginationQuery;
				const page = parseInt(query.page || "1", 10);
				const limit = parseInt(query.limit || "20", 10);

				const { deliveries, total } = await getFailedDeliveries(eventId, page, limit);

				const serializedDeliveries = deliveries.map(d => ({
					...d,
					createdAt: d.createdAt.toISOString(),
					updatedAt: d.updatedAt.toISOString(),
					nextRetryAt: d.nextRetryAt?.toISOString() || null
				}));

				const totalPages = Math.ceil(total / limit);

				return reply.send(
					successResponse(serializedDeliveries, "Failed deliveries retrieved", {
						page,
						limit,
						total,
						totalPages,
						hasNext: page < totalPages,
						hasPrev: page > 1
					})
				);
			} catch (error) {
				request.log.error({ err: error }, "Get failed deliveries error");
				const { response, statusCode } = serverErrorResponse("Failed to get deliveries");
				return reply.code(statusCode).send(response);
			}
		}
	);

	/**
	 * Retry a failed webhook delivery
	 */
	fastify.post<{
		Params: DeliveryIdParams;
	}>(
		"/events/:eventId/webhook/deliveries/:deliveryId/retry",
		{
			preHandler: [requireEventAccess],
			schema: {
				description: "Retry a failed webhook delivery",
				tags: ["webhooks"]
			}
		},
		async (request: FastifyRequest<{ Params: DeliveryIdParams }>, reply: FastifyReply) => {
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
				request.log.error({ err: error }, "Retry delivery error");
				const { response, statusCode } = serverErrorResponse("Failed to retry delivery");
				return reply.code(statusCode).send(response);
			}
		}
	);
};

export default webhooksRoutes;
