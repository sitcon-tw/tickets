/**
 * Cloudflare Turnstile validation utility
 * Server-side validation for Turnstile tokens
 */

import { logger } from "#utils/logger";
import { SpanStatusCode } from "@opentelemetry/api";
import type { TurnstileResponse, TurnstileValidationOptions, TurnstileValidationResult } from "@sitcontix/types";
import { tracer } from "./tracing";

const componentLogger = logger.child({ component: "turnstile" });

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const BYPASS_SECRET = process.env.TURNSTILE_BYPASS_SECRET;
const VALIDATION_TIMEOUT = 10000; // 10 seconds

/**
 * Validate a Turnstile token with Cloudflare's Siteverify API
 * @param token The token from the client-side widget
 * @param options Validation options including remoteip, idempotency key, etc.
 * @returns Validation result with success status and details
 */
export async function validateTurnstile(token: string, options: TurnstileValidationOptions = {}): Promise<TurnstileValidationResult> {
	const span = tracer.startSpan("turnstile.validate", {
		attributes: {
			"turnstile.token.length": token?.length || 0,
			"turnstile.expected_action": options.expectedAction || "",
			"turnstile.expected_hostname": options.expectedHostname || ""
		}
	});

	try {
		if (!token || typeof token !== "string") {
			span.addEvent("turnstile.validation.invalid_token_format");
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Invalid token format" });
			return {
				valid: false,
				reason: "invalid_token_format",
				errors: ["Token is missing or not a string"]
			};
		}

		// Bypass validation if token matches the bypass secret
		if (BYPASS_SECRET && token === BYPASS_SECRET) {
			span.addEvent("turnstile.validation.bypassed");
			span.setStatus({ code: SpanStatusCode.OK });
			return {
				valid: true,
				data: {
					success: true,
					hostname: "bypass"
				}
			};
		}

		if (token.length > 2048) {
			span.addEvent("turnstile.validation.token_too_long");
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Token too long" });
			return {
				valid: false,
				reason: "token_too_long",
				errors: ["Token exceeds maximum length of 2048 characters"]
			};
		}

		if (!SECRET_KEY) {
			componentLogger.error("TURNSTILE_SECRET_KEY is not configured");
			span.addEvent("turnstile.validation.misconfigured");
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Server configuration error" });
			return {
				valid: false,
				reason: "server_configuration_error",
				errors: ["Turnstile is not properly configured"]
			};
		}
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT);

		try {
			const formData = new URLSearchParams();
			formData.append("secret", SECRET_KEY);
			formData.append("response", token);

			if (options.remoteip) {
				formData.append("remoteip", options.remoteip);
				span.setAttribute("turnstile.remoteip.masked", options.remoteip.substring(0, 8) + "***");
			}

			if (options.idempotencyKey) {
				formData.append("idempotency_key", options.idempotencyKey);
			}

			span.addEvent("turnstile.api.request");

			const response = await fetch(SITEVERIFY_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: formData.toString(),
				signal: controller.signal
			});

			span.setAttribute("http.status_code", response.status);

			const result = (await response.json()) as TurnstileResponse;

			if (!result.success) {
				span.addEvent("turnstile.validation.failed", {
					"error.codes": result["error-codes"]?.join(", ") || "unknown"
				});
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Turnstile validation failed" });
				return {
					valid: false,
					reason: "turnstile_failed",
					errors: result["error-codes"] || ["unknown_error"]
				};
			}
			if (options.expectedAction && result.action !== options.expectedAction) {
				span.addEvent("turnstile.validation.action_mismatch", {
					expected: options.expectedAction,
					received: result.action || ""
				});
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Action mismatch" });
				return {
					valid: false,
					reason: "action_mismatch",
					expected: options.expectedAction,
					received: result.action
				};
			}

			if (options.expectedHostname && result.hostname !== options.expectedHostname) {
				span.addEvent("turnstile.validation.hostname_mismatch", {
					expected: options.expectedHostname,
					received: result.hostname || ""
				});
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Hostname mismatch" });
				return {
					valid: false,
					reason: "hostname_mismatch",
					expected: options.expectedHostname,
					received: result.hostname
				};
			}

			let tokenAge: number | undefined;
			if (result.challenge_ts) {
				const challengeTime = new Date(result.challenge_ts);
				const now = new Date();
				tokenAge = (now.getTime() - challengeTime.getTime()) / (1000 * 60);
				span.setAttribute("turnstile.token.age_minutes", tokenAge);

				if (tokenAge > 4) {
					componentLogger.warn({ tokenAge: tokenAge.toFixed(1) }, "Turnstile token is minutes old (expires at 5 minutes)");
					span.addEvent("turnstile.validation.token_age_warning", {
						age_minutes: tokenAge.toFixed(1)
					});
				}
			}

			span.setStatus({ code: SpanStatusCode.OK });

			return {
				valid: true,
				data: result,
				tokenAge
			};
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === "AbortError") {
				span.addEvent("turnstile.validation.timeout");
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Validation timeout" });
				return {
					valid: false,
					reason: "validation_timeout",
					errors: ["Validation request timed out"]
				};
			}

			componentLogger.error({ error }, "Turnstile validation error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Internal validation error" });
			return {
				valid: false,
				reason: "internal_error",
				errors: ["Internal validation error occurred"]
			};
		} finally {
			clearTimeout(timeoutId);
		}
	} catch (error) {
		span.recordException(error as Error);
		span.setStatus({ code: SpanStatusCode.ERROR, message: "Unexpected error" });
		throw error;
	} finally {
		span.end();
	}
}

/**
 * Validate a Turnstile token with retry logic
 * @param token The token from the client-side widget
 * @param options Validation options
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @returns Validation result
 */
export async function validateTurnstileWithRetry(token: string, options: TurnstileValidationOptions = {}, maxRetries = 3): Promise<TurnstileValidationResult> {
	const span = tracer.startSpan("turnstile.validate_with_retry", {
		attributes: {
			"turnstile.max_retries": maxRetries,
			"turnstile.token.length": token?.length || 0
		}
	});

	try {
		const idempotencyKey = options.idempotencyKey || crypto.randomUUID();
		span.setAttribute("turnstile.idempotency_key", idempotencyKey);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			span.addEvent("turnstile.retry.attempt", {
				attempt: attempt,
				max_retries: maxRetries
			});

			const result = await validateTurnstile(token, {
				...options,
				idempotencyKey
			});

			if (result.valid || (result.reason !== "validation_timeout" && result.reason !== "internal_error")) {
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			}

			if (attempt === maxRetries) {
				span.addEvent("turnstile.retry.max_attempts_reached");
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Max retries reached" });
				return result;
			}

			const backoffMs = Math.pow(2, attempt) * 1000;
			span.addEvent("turnstile.retry.backoff", {
				backoff_ms: backoffMs
			});
			await new Promise(resolve => setTimeout(resolve, backoffMs));
		}

		span.setStatus({ code: SpanStatusCode.ERROR, message: "Max retries exceeded" });
		return {
			valid: false,
			reason: "max_retries_exceeded",
			errors: ["Maximum retry attempts exceeded"]
		};
	} catch (error) {
		span.recordException(error as Error);
		span.setStatus({ code: SpanStatusCode.ERROR, message: "Retry failed with exception" });
		throw error;
	} finally {
		span.end();
	}
}

/**
 * Get the client's IP address from request headers
 * Checks Cloudflare-specific headers first, then fallbacks
 */
export function getClientIP(headers: Record<string, string | string[] | undefined>): string {
	const cfConnectingIP = headers["cf-connecting-ip"];
	if (cfConnectingIP && typeof cfConnectingIP === "string") {
		return cfConnectingIP;
	}

	const xForwardedFor = headers["x-forwarded-for"];
	if (xForwardedFor) {
		const forwardedIP = typeof xForwardedFor === "string" ? xForwardedFor : xForwardedFor[0];
		return forwardedIP.split(",")[0].trim();
	}

	const xRealIP = headers["x-real-ip"];
	if (xRealIP && typeof xRealIP === "string") {
		return xRealIP;
	}

	return "unknown";
}
