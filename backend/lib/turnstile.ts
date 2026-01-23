/**
 * Cloudflare Turnstile validation utility
 * Server-side validation for Turnstile tokens
 */

import type { TurnstileResponse, TurnstileValidationOptions, TurnstileValidationResult } from "@sitcontix/types";

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
	if (!token || typeof token !== "string") {
		return {
			valid: false,
			reason: "invalid_token_format",
			errors: ["Token is missing or not a string"]
		};
	}

	// Bypass validation if token matches the bypass secret
	if (BYPASS_SECRET && token === BYPASS_SECRET) {
		return {
			valid: true,
			data: {
				success: true,
				hostname: "bypass"
			}
		};
	}

	if (token.length > 2048) {
		return {
			valid: false,
			reason: "token_too_long",
			errors: ["Token exceeds maximum length of 2048 characters"]
		};
	}

	if (!SECRET_KEY) {
		console.error("TURNSTILE_SECRET_KEY is not configured");
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
		}

		if (options.idempotencyKey) {
			formData.append("idempotency_key", options.idempotencyKey);
		}

		const response = await fetch(SITEVERIFY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: formData.toString(),
			signal: controller.signal
		});

		const result = (await response.json()) as TurnstileResponse;

		if (!result.success) {
			return {
				valid: false,
				reason: "turnstile_failed",
				errors: result["error-codes"] || ["unknown_error"]
			};
		}
		if (options.expectedAction && result.action !== options.expectedAction) {
			return {
				valid: false,
				reason: "action_mismatch",
				expected: options.expectedAction,
				received: result.action
			};
		}

		if (options.expectedHostname && result.hostname !== options.expectedHostname) {
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

			if (tokenAge > 4) {
				console.warn(`Turnstile token is ${tokenAge.toFixed(1)} minutes old (expires at 5 minutes)`);
			}
		}

		return {
			valid: true,
			data: result,
			tokenAge
		};
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof Error && error.name === "AbortError") {
			return {
				valid: false,
				reason: "validation_timeout",
				errors: ["Validation request timed out"]
			};
		}

		console.error("Turnstile validation error:", error);
		return {
			valid: false,
			reason: "internal_error",
			errors: ["Internal validation error occurred"]
		};
	} finally {
		clearTimeout(timeoutId);
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
	const idempotencyKey = options.idempotencyKey || crypto.randomUUID();

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		const result = await validateTurnstile(token, {
			...options,
			idempotencyKey
		});

		if (result.valid || (result.reason !== "validation_timeout" && result.reason !== "internal_error")) {
			return result;
		}

		if (attempt === maxRetries) {
			return result;
		}

		await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
	}

	return {
		valid: false,
		reason: "max_retries_exceeded",
		errors: ["Maximum retry attempts exceeded"]
	};
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
