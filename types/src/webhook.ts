/**
 * Webhook types and schemas for SITCONTIX
 */

import { z } from "zod/v4";
import { LocalizedTextSchema } from "./common.js";

/**
 * Webhook event types
 */
export const WebhookEventTypeSchema = z.enum([
	"registration_confirmed", // Registration created and confirmed
	"registration_cancelled" // Registration cancelled
]);
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

/**
 * Auth header name validation
 * - Not empty, max 128 characters
 * - No reserved headers
 * - No non-ASCII characters
 */
const RESERVED_HEADERS = ["cookie", "authorization", "content-type", "content-length", "user-agent", "x-forwarded-for"];

export const AuthHeaderNameSchema = z
	.string()
	.max(128, "Auth header name must not exceed 128 characters")
	.regex(/^[\x20-\x7E]+$/, "Auth header name must only contain ASCII characters")
	.refine(val => !RESERVED_HEADERS.includes(val.toLowerCase()), {
		message: "Auth header name cannot be a reserved header"
	});

/**
 * Auth header value validation
 * - Not empty, max 512 characters
 * - No non-ASCII characters
 */
export const AuthHeaderValueSchema = z
	.string()
	.max(512, "Auth header value must not exceed 512 characters")
	.regex(/^[\x20-\x7E]+$/, "Auth header value must only contain ASCII characters");

/**
 * Webhook endpoint entity
 */
export const WebhookEndpointSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	url: z.url().startsWith("https://", "Webhook URL must use HTTPS"),
	authHeaderName: z.string().nullable().optional(),
	authHeaderValue: z.string().nullable().optional(),
	eventTypes: z.array(WebhookEventTypeSchema),
	isActive: z.boolean(),
	consecutiveFailurePeriods: z.number().int().min(0),
	lastFailureAt: z.iso.datetime().nullable().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime()
});
export type WebhookEndpoint = z.infer<typeof WebhookEndpointSchema>;

/**
 * Webhook endpoint create request
 */
export const WebhookEndpointCreateRequestSchema = z
	.object({
		eventId: z.string(),
		url: z.url().startsWith("https://", "Webhook URL must use HTTPS"),
		authHeaderName: AuthHeaderNameSchema.optional(),
		authHeaderValue: AuthHeaderValueSchema.optional(),
		eventTypes: z.array(WebhookEventTypeSchema).min(1, "At least one event type is required")
	})
	.refine(
		data => {
			// If one auth header field is provided, both must be provided
			const hasName = data.authHeaderName !== undefined && data.authHeaderName !== "";
			const hasValue = data.authHeaderValue !== undefined && data.authHeaderValue !== "";
			return hasName === hasValue;
		},
		{
			message: "Both auth header name and value must be provided together, or neither"
		}
	);
export type WebhookEndpointCreateRequest = z.infer<typeof WebhookEndpointCreateRequestSchema>;

/**
 * Webhook endpoint update request
 */
export const WebhookEndpointUpdateRequestSchema = z
	.object({
		url: z.url().startsWith("https://", "Webhook URL must use HTTPS").optional(),
		authHeaderName: AuthHeaderNameSchema.nullable().optional(),
		authHeaderValue: AuthHeaderValueSchema.nullable().optional(),
		eventTypes: z.array(WebhookEventTypeSchema).min(1).optional(),
		isActive: z.boolean().optional()
	})
	.refine(
		data => {
			// If updating auth headers, both must be provided together or both null
			const hasName = data.authHeaderName !== undefined;
			const hasValue = data.authHeaderValue !== undefined;
			if (!hasName && !hasValue) return true; // Not updating auth headers
			if (hasName && hasValue) {
				// Both provided - check if they're both null or both have values
				const nameIsNull = data.authHeaderName === null;
				const valueIsNull = data.authHeaderValue === null;
				return nameIsNull === valueIsNull;
			}
			return false; // Only one provided
		},
		{
			message: "Both auth header name and value must be updated together"
		}
	);
export type WebhookEndpointUpdateRequest = z.infer<typeof WebhookEndpointUpdateRequestSchema>;

/**
 * Webhook delivery status
 */
export const WebhookDeliveryStatusSchema = z.enum(["pending", "success", "failed"]);
export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatusSchema>;

/**
 * Webhook delivery entity
 */
export const WebhookDeliverySchema = z.object({
	id: z.string(),
	webhookId: z.string(),
	eventType: WebhookEventTypeSchema,
	payload: z.string(),
	status: WebhookDeliveryStatusSchema,
	statusCode: z.number().int().nullable().optional(),
	responseBody: z.string().nullable().optional(),
	errorMessage: z.string().nullable().optional(),
	retryCount: z.number().int().min(0),
	nextRetryAt: z.iso.datetime().nullable().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime()
});
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

/**
 * Webhook payload - Event info
 */
export const WebhookEventInfoSchema = z.object({
	name: LocalizedTextSchema,
	slug: z.string().nullable()
});
export type WebhookEventInfo = z.infer<typeof WebhookEventInfoSchema>;

/**
 * Webhook payload - Registration info (for registration_confirmed)
 */
export const WebhookRegistrationInfoSchema = z.object({
	id: z.string(),
	status: z.string(),
	created_at: z.string(), // ISO datetime string
	email: z.string(),
	token: z.string() // SHA-256 hash of registrationId + createdAt for verification
});
export type WebhookRegistrationInfo = z.infer<typeof WebhookRegistrationInfoSchema>;

/**
 * Webhook payload - Cancelled registration info
 */
export const WebhookCancelledRegistrationInfoSchema = z.object({
	id: z.string(),
	status: z.literal("cancelled"),
	cancelled_at: z.string(), // ISO datetime string
	token: z.string() // SHA-256 hash of registrationId + createdAt for verification
});
export type WebhookCancelledRegistrationInfo = z.infer<typeof WebhookCancelledRegistrationInfoSchema>;

/**
 * Webhook payload - Attendee info
 */
export const WebhookAttendeeSchema = z.object({
	name: z.string().optional(),
	email: z.string()
});
export type WebhookAttendee = z.infer<typeof WebhookAttendeeSchema>;

/**
 * Webhook payload - Ticket info
 */
export const WebhookTicketInfoSchema = z.object({
	price: z.number(),
	name: LocalizedTextSchema,
	id: z.string(),
	attendee: WebhookAttendeeSchema
});
export type WebhookTicketInfo = z.infer<typeof WebhookTicketInfoSchema>;

/**
 * Webhook notification - registration confirmed
 */
export const WebhookRegistrationConfirmedNotificationSchema = z.object({
	type: z.literal("registration_confirmed"),
	event: WebhookEventInfoSchema,
	registration: WebhookRegistrationInfoSchema,
	ticket: WebhookTicketInfoSchema,
	formData: z.record(z.string(), z.unknown()).optional()
});
export type WebhookRegistrationConfirmedNotification = z.infer<typeof WebhookRegistrationConfirmedNotificationSchema>;

/**
 * Webhook notification - registration cancelled
 */
export const WebhookRegistrationCancelledNotificationSchema = z.object({
	type: z.literal("registration_cancelled"),
	event: WebhookEventInfoSchema,
	registration: WebhookCancelledRegistrationInfoSchema
});
export type WebhookRegistrationCancelledNotification = z.infer<typeof WebhookRegistrationCancelledNotificationSchema>;

/**
 * Webhook notification union type
 */
export const WebhookNotificationSchema = z.discriminatedUnion("type", [WebhookRegistrationConfirmedNotificationSchema, WebhookRegistrationCancelledNotificationSchema]);
export type WebhookNotification = z.infer<typeof WebhookNotificationSchema>;

/**
 * Webhook payload body (batch notifications)
 */
export const WebhookPayloadSchema = z.object({
	notifications: z.array(WebhookNotificationSchema)
});
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Test webhook payload (fixed payload for testing)
 */
export const TestWebhookPayloadSchema = z.object({
	notifications: z.array(
		z.object({
			type: WebhookEventTypeSchema,
			event: z.object({
				name: z.object({
					en: z.string(),
					"zh-Hant": z.string()
				}),
				slug: z.string()
			}),
			registration: z.object({
				id: z.string(),
				status: z.string(),
				created_at: z.string().optional(),
				cancelled_at: z.string().optional(),
				email: z.string().optional()
			}),
			ticket: z
				.object({
					price: z.number(),
					name: z.object({
						en: z.string(),
						"zh-Hant": z.string()
					}),
					id: z.string(),
					attendee: z.object({
						name: z.string(),
						email: z.string()
					})
				})
				.optional(),
			formData: z.record(z.string(), z.unknown()).optional()
		})
	)
});

/**
 * Webhook test request
 */
export const WebhookTestRequestSchema = z.object({
	url: z.url().startsWith("https://", "Webhook URL must use HTTPS"),
	authHeaderName: AuthHeaderNameSchema.optional(),
	authHeaderValue: AuthHeaderValueSchema.optional()
});
export type WebhookTestRequest = z.infer<typeof WebhookTestRequestSchema>;

/**
 * Webhook test response
 */
export const WebhookTestResponseSchema = z.object({
	success: z.boolean(),
	statusCode: z.number().int().optional(),
	responseBody: z.string().optional(),
	errorMessage: z.string().optional()
});
export type WebhookTestResponse = z.infer<typeof WebhookTestResponseSchema>;

/**
 * Failed webhook deliveries list response
 */
export const WebhookFailedDeliveriesResponseSchema = z.object({
	deliveries: z.array(WebhookDeliverySchema),
	total: z.number().int().min(0)
});
export type WebhookFailedDeliveriesResponse = z.infer<typeof WebhookFailedDeliveriesResponseSchema>;
