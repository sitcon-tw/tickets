/**
 * Webhook service for SITCONTIX
 * Handles webhook dispatching, retries, and auto-disable logic
 */

import prisma from "#config/database";
import type {
	WebhookAttendee,
	WebhookEventInfo,
	WebhookEventType,
	WebhookNotification,
	WebhookPayload,
	WebhookRegistrationCancelledNotification,
	WebhookRegistrationConfirmedNotification,
	WebhookTestResponse,
	WebhookTicketInfo
} from "@sitcontix/types";

import crypto from "crypto";
import dns from "dns";

// Force IPv4-first DNS resolution to avoid IPv6 connectivity issues in containers
dns.setDefaultResultOrder("ipv4first");

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const OBSERVATION_PERIOD_MS = 20 * 60 * 1000; // 20 minutes
const MAX_CONSECUTIVE_FAILURE_PERIODS = 3; // Auto-disable after 3 consecutive 20-min failure periods
const REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds timeout
const MAX_RESPONSE_BODY_LENGTH = 1000; // Truncate response body

/**
 * Generate a verification token for registration
 * SHA-256 hash of registrationId + createdAt
 */
function generateRegistrationToken(registrationId: string, createdAt: string): string {
	const text = registrationId + createdAt;
	return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Test webhook endpoint connectivity
 */
export async function testWebhookEndpoint(url: string, authHeaderName?: string, authHeaderValue?: string): Promise<WebhookTestResponse> {
	const testCreatedAt = new Date().toISOString();
	const testRegistrationId = "test-registration-123";
	const testToken = generateRegistrationToken(testRegistrationId, testCreatedAt);

	const testPayload: WebhookPayload = {
		notifications: [
			{
				type: "registration_confirmed",
				event: {
					name: { en: "Test Event", "zh-Hant": "測試活動" },
					slug: "test-event"
				},
				registration: {
					id: testRegistrationId,
					status: "confirmed",
					created_at: testCreatedAt,
					email: "test@example.com",
					token: testToken
				},
				ticket: {
					price: 1000,
					name: { en: "General Admission", "zh-Hant": "一般票" },
					id: "test-ticket-12",
					attendee: {
						name: "Test User",
						email: "test@example.com"
					}
				},
				formData: {
					name: "Test User",
					email: "test@example.com"
				}
			},
			{
				type: "registration_cancelled",
				event: {
					name: { en: "Test Event", "zh-Hant": "測試活動" },
					slug: "test-event"
				},
				registration: {
					id: testRegistrationId,
					status: "cancelled",
					cancelled_at: new Date().toISOString(),
					token: testToken
				}
			}
		]
	};

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			"User-Agent": "SITCONTIX-Webhook/1.0"
		};

		if (authHeaderName && authHeaderValue) {
			headers[authHeaderName] = authHeaderValue;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(testPayload),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		const responseBody = await response.text();
		const truncatedBody = responseBody.length > MAX_RESPONSE_BODY_LENGTH ? responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH) + "..." : responseBody;

		return {
			success: response.status === 200,
			statusCode: response.status,
			responseBody: truncatedBody,
			errorMessage: response.status !== 200 ? `HTTP ${response.status}: ${response.statusText}` : undefined
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			success: false,
			errorMessage: errorMessage.includes("abort") ? "Request timeout" : errorMessage
		};
	}
}

/**
 * Build webhook notification for registration confirmed
 */
export function buildRegistrationConfirmedNotification(
	event: { name: any; slug: string | null },
	registration: { id: string; status: string; createdAt: Date; email: string; formData: string | null },
	ticket: { id: string; name: any; price: number }
): WebhookRegistrationConfirmedNotification {
	const formData = registration.formData ? JSON.parse(registration.formData) : {};

	const attendee: WebhookAttendee = {
		name: formData.name || undefined,
		email: registration.email
	};

	const ticketInfo: WebhookTicketInfo = {
		price: ticket.price,
		name: ticket.name,
		id: ticket.id,
		attendee
	};

	const eventInfo: WebhookEventInfo = {
		name: event.name,
		slug: event.slug
	};

	const createdAtIso = registration.createdAt.toISOString();
	const token = generateRegistrationToken(registration.id, createdAtIso);

	return {
		type: "registration_confirmed",
		event: eventInfo,
		registration: {
			id: registration.id,
			status: registration.status,
			created_at: createdAtIso,
			email: registration.email,
			token
		},
		ticket: ticketInfo,
		formData
	};
}

/**
 * Build webhook notification for registration cancelled
 */
export function buildRegistrationCancelledNotification(
	event: { name: any; slug: string | null },
	registration: { id: string; createdAt: Date; updatedAt: Date }
): WebhookRegistrationCancelledNotification {
	const eventInfo: WebhookEventInfo = {
		name: event.name,
		slug: event.slug
	};

	// Token is based on original createdAt, not cancelled_at
	const token = generateRegistrationToken(registration.id, registration.createdAt.toISOString());

	return {
		type: "registration_cancelled",
		event: eventInfo,
		registration: {
			id: registration.id,
			status: "cancelled",
			cancelled_at: registration.updatedAt.toISOString(),
			token
		}
	};
}

/**
 * Send webhook notification
 */
async function sendWebhookRequest(
	url: string,
	payload: WebhookPayload,
	authHeaderName?: string | null,
	authHeaderValue?: string | null
): Promise<{ success: boolean; statusCode?: number; responseBody?: string; errorMessage?: string }> {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			"User-Agent": "SITCONTIX-Webhook/1.0"
		};

		if (authHeaderName && authHeaderValue) {
			headers[authHeaderName] = authHeaderValue;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		const responseBody = await response.text();
		const truncatedBody = responseBody.length > MAX_RESPONSE_BODY_LENGTH ? responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH) + "..." : responseBody;

		return {
			success: response.status === 200,
			statusCode: response.status,
			responseBody: truncatedBody,
			errorMessage: response.status !== 200 ? `HTTP ${response.status}: ${response.statusText}` : undefined
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			success: false,
			errorMessage: errorMessage.includes("abort") ? "Request timeout" : errorMessage
		};
	}
}

/**
 * Dispatch webhook for an event
 * This is the main entry point for sending webhooks
 */
export async function dispatchWebhook(eventId: string, eventType: WebhookEventType, notification: WebhookNotification): Promise<void> {
	try {
		// Find webhook endpoint for this event
		const webhook = await prisma.webhookEndpoint.findUnique({
			where: { eventId }
		});

		// No webhook configured or not active
		if (!webhook || !webhook.isActive) {
			return;
		}

		// Check if this event type is subscribed
		if (!webhook.eventTypes.includes(eventType)) {
			return;
		}

		const payload: WebhookPayload = {
			notifications: [notification]
		};

		// Create delivery record
		const delivery = await prisma.webhookDelivery.create({
			data: {
				webhookId: webhook.id,
				eventType,
				payload: JSON.stringify(payload),
				status: "pending"
			}
		});

		// Send the webhook
		const result = await sendWebhookRequest(webhook.url, payload, webhook.authHeaderName, webhook.authHeaderValue);

		if (result.success) {
			// Success - update delivery and reset failure tracking
			await prisma.$transaction([
				prisma.webhookDelivery.update({
					where: { id: delivery.id },
					data: {
						status: "success",
						statusCode: result.statusCode,
						responseBody: result.responseBody
					}
				}),
				// Reset failure tracking on success
				prisma.webhookEndpoint.update({
					where: { id: webhook.id },
					data: {
						consecutiveFailurePeriods: 0,
						lastFailureAt: null
					}
				})
			]);
		} else {
			// Failure - schedule retry
			const nextRetryAt = new Date(Date.now() + RETRY_INTERVAL_MS);

			await prisma.webhookDelivery.update({
				where: { id: delivery.id },
				data: {
					status: "failed",
					statusCode: result.statusCode,
					responseBody: result.responseBody,
					errorMessage: result.errorMessage,
					retryCount: 0,
					nextRetryAt
				}
			});

			// Update failure tracking for auto-disable
			await updateFailureTracking(webhook.id);
		}
	} catch (error) {
		console.error("Error dispatching webhook:", error);
	}
}

/**
 * Update failure tracking for auto-disable mechanism
 */
async function updateFailureTracking(webhookId: string): Promise<void> {
	const webhook = await prisma.webhookEndpoint.findUnique({
		where: { id: webhookId }
	});

	if (!webhook) return;

	const now = new Date();

	if (!webhook.lastFailureAt) {
		// First failure - start observation period
		await prisma.webhookEndpoint.update({
			where: { id: webhookId },
			data: { lastFailureAt: now }
		});
	} else {
		const timeSinceLastFailure = now.getTime() - webhook.lastFailureAt.getTime();

		if (timeSinceLastFailure >= OBSERVATION_PERIOD_MS) {
			// Observation period ended with all failures - increment counter
			const newFailurePeriods = webhook.consecutiveFailurePeriods + 1;

			if (newFailurePeriods >= MAX_CONSECUTIVE_FAILURE_PERIODS) {
				// Auto-disable webhook
				await prisma.webhookEndpoint.update({
					where: { id: webhookId },
					data: {
						isActive: false,
						consecutiveFailurePeriods: newFailurePeriods,
						lastFailureAt: now
					}
				});
				console.log(`Webhook ${webhookId} auto-disabled after ${newFailurePeriods} consecutive failure periods`);
			} else {
				// Start new observation period
				await prisma.webhookEndpoint.update({
					where: { id: webhookId },
					data: {
						consecutiveFailurePeriods: newFailurePeriods,
						lastFailureAt: now
					}
				});
			}
		}
		// If still within observation period, do nothing (wait for period to end)
	}
}

/**
 * Process pending webhook retries
 * This should be called periodically (e.g., every minute via cron job)
 */
export async function processWebhookRetries(): Promise<void> {
	const now = new Date();

	// Find deliveries that need retry
	const pendingRetries = await prisma.webhookDelivery.findMany({
		where: {
			status: "failed",
			retryCount: { lt: MAX_RETRIES },
			nextRetryAt: { lte: now }
		},
		include: {
			webhook: true
		}
	});

	for (const delivery of pendingRetries) {
		// Skip if webhook is no longer active
		if (!delivery.webhook.isActive) {
			continue;
		}

		const payload: WebhookPayload = JSON.parse(delivery.payload);

		const result = await sendWebhookRequest(delivery.webhook.url, payload, delivery.webhook.authHeaderName, delivery.webhook.authHeaderValue);

		if (result.success) {
			// Retry succeeded
			await prisma.$transaction([
				prisma.webhookDelivery.update({
					where: { id: delivery.id },
					data: {
						status: "success",
						statusCode: result.statusCode,
						responseBody: result.responseBody,
						errorMessage: null,
						nextRetryAt: null
					}
				}),
				// Reset failure tracking on success
				prisma.webhookEndpoint.update({
					where: { id: delivery.webhookId },
					data: {
						consecutiveFailurePeriods: 0,
						lastFailureAt: null
					}
				})
			]);
		} else {
			// Retry failed
			const newRetryCount = delivery.retryCount + 1;

			if (newRetryCount >= MAX_RETRIES) {
				// Max retries reached - mark as permanently failed
				await prisma.webhookDelivery.update({
					where: { id: delivery.id },
					data: {
						status: "failed",
						statusCode: result.statusCode,
						responseBody: result.responseBody,
						errorMessage: result.errorMessage,
						retryCount: newRetryCount,
						nextRetryAt: null
					}
				});

				// Update failure tracking
				await updateFailureTracking(delivery.webhookId);
			} else {
				// Schedule next retry
				const nextRetryAt = new Date(Date.now() + RETRY_INTERVAL_MS);

				await prisma.webhookDelivery.update({
					where: { id: delivery.id },
					data: {
						statusCode: result.statusCode,
						responseBody: result.responseBody,
						errorMessage: result.errorMessage,
						retryCount: newRetryCount,
						nextRetryAt
					}
				});
			}
		}
	}
}

/**
 * Get failed webhook deliveries for an event
 */
export async function getFailedDeliveries(eventId: string, page: number = 1, limit: number = 20): Promise<{ deliveries: any[]; total: number }> {
	const webhook = await prisma.webhookEndpoint.findUnique({
		where: { eventId }
	});

	if (!webhook) {
		return { deliveries: [], total: 0 };
	}

	const [deliveries, total] = await Promise.all([
		prisma.webhookDelivery.findMany({
			where: {
				webhookId: webhook.id,
				status: "failed",
				retryCount: { gte: MAX_RETRIES } // Only permanently failed
			},
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit
		}),
		prisma.webhookDelivery.count({
			where: {
				webhookId: webhook.id,
				status: "failed",
				retryCount: { gte: MAX_RETRIES }
			}
		})
	]);

	return { deliveries, total };
}

/**
 * Manually retry a failed delivery
 */
export async function retryFailedDelivery(deliveryId: string): Promise<boolean> {
	const delivery = await prisma.webhookDelivery.findUnique({
		where: { id: deliveryId },
		include: { webhook: true }
	});

	if (!delivery || delivery.status !== "failed") {
		return false;
	}

	if (!delivery.webhook.isActive) {
		return false;
	}

	const payload: WebhookPayload = JSON.parse(delivery.payload);
	const result = await sendWebhookRequest(delivery.webhook.url, payload, delivery.webhook.authHeaderName, delivery.webhook.authHeaderValue);

	if (result.success) {
		await prisma.$transaction([
			prisma.webhookDelivery.update({
				where: { id: delivery.id },
				data: {
					status: "success",
					statusCode: result.statusCode,
					responseBody: result.responseBody,
					errorMessage: null,
					nextRetryAt: null
				}
			}),
			prisma.webhookEndpoint.update({
				where: { id: delivery.webhookId },
				data: {
					consecutiveFailurePeriods: 0,
					lastFailureAt: null
				}
			})
		]);
		return true;
	}

	await prisma.webhookDelivery.update({
		where: { id: delivery.id },
		data: {
			statusCode: result.statusCode,
			responseBody: result.responseBody,
			errorMessage: result.errorMessage
		}
	});

	return false;
}
