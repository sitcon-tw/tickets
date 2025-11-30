/**
 * @fileoverview Database operation tracing utilities
 * Provides manual tracing for Prisma database operations
 */

import { addSpanEvent, withSpan } from "#lib/tracing";
import type { Span } from "@opentelemetry/api";
import type { NoopSpan } from "#lib/tracing";

interface QueryParams {
	where?: any;
	include?: any;
	select?: any;
	[key: string]: any;
}

/**
 * Trace a Prisma database operation
 * @param model - The Prisma model name (e.g., "User", "Event")
 * @param operation - The operation name (e.g., "findUnique", "create", "update")
 * @param fn - The database operation function
 * @param queryParams - Query parameters for debugging (optional)
 * @returns Promise resolving to the operation result
 */
export async function tracePrismaOperation<T>(
	model: string,
	operation: string,
	fn: () => Promise<T>,
	queryParams: QueryParams = {}
): Promise<T> {
	const spanName = `prisma.${model}.${operation}`;

	return withSpan(
		spanName,
		async (span: Span | NoopSpan) => {
			// Add database-specific attributes
			span.setAttribute("db.system", "postgresql");
			span.setAttribute("db.operation", operation);
			span.setAttribute("db.prisma.model", model);

			// Add query parameters as attributes (be careful with sensitive data)
			if (queryParams.where) {
				span.setAttribute("db.where", JSON.stringify(queryParams.where));
			}
			if (queryParams.include) {
				span.setAttribute("db.include", JSON.stringify(queryParams.include));
			}
			if (queryParams.select) {
				span.setAttribute("db.select", JSON.stringify(queryParams.select));
			}

			// Record start of operation
			addSpanEvent("db.query.start");

			// Execute the operation
			const startTime = Date.now();
			const result = await fn();
			const duration = Date.now() - startTime;

			// Record completion
			addSpanEvent("db.query.complete", {
				"db.query.duration_ms": duration,
				"db.result.count": Array.isArray(result) ? result.length : result ? 1 : 0
			});

			span.setAttribute("db.query.duration_ms", duration);

			return result;
		},
		{
			"db.system": "postgresql",
			"db.operation": operation,
			"db.prisma.model": model
		}
	);
}

/**
 * Trace a Redis cache operation
 * @param operation - The operation name (e.g., "get", "set", "del")
 * @param key - The cache key
 * @param fn - The cache operation function
 * @returns Promise resolving to the operation result
 */
export async function traceRedisOperation<T>(
	operation: string,
	key: string,
	fn: () => Promise<T>
): Promise<T> {
	const spanName = `redis.${operation}`;

	return withSpan(spanName, async (span: Span | NoopSpan) => {
		span.setAttribute("db.system", "redis");
		span.setAttribute("db.operation", operation);
		span.setAttribute("db.redis.key", key);

		const startTime = Date.now();
		const result = await fn();
		const duration = Date.now() - startTime;

		span.setAttribute("db.query.duration_ms", duration);
		span.setAttribute("cache.hit", result !== null && result !== undefined);

		return result;
	});
}

/**
 * Trace a business logic operation
 * @param operationName - The operation name
 * @param fn - The operation function
 * @param attributes - Additional attributes
 * @returns Promise resolving to the operation result
 */
export async function traceBusinessOperation<T>(
	operationName: string,
	fn: (span: Span | NoopSpan) => Promise<T>,
	attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
	return withSpan(
		operationName,
		async (span: Span | NoopSpan) => {
			const startTime = Date.now();
			const result = await fn(span);
			const duration = Date.now() - startTime;

			span.setAttribute("operation.duration_ms", duration);

			return result;
		},
		{
			"operation.type": "business_logic",
			...attributes
		}
	);
}

/**
 * Trace an email sending operation
 * @param recipient - Email recipient
 * @param subject - Email subject
 * @param fn - The email sending function
 * @returns Promise resolving to the operation result
 */
export async function traceEmailOperation<T>(
	recipient: string,
	subject: string,
	fn: () => Promise<T>
): Promise<T> {
	return withSpan(
		"email.send",
		async (span: Span | NoopSpan) => {
			span.setAttribute("email.recipient", recipient);
			span.setAttribute("email.subject", subject);

			const result = await fn();

			span.setAttribute("email.sent", true);

			return result;
		},
		{
			"email.recipient": recipient,
			"email.subject": subject
		}
	);
}

/**
 * Trace an SMS sending operation
 * @param phoneNumber - Phone number
 * @param fn - The SMS sending function
 * @returns Promise resolving to the operation result
 */
export async function traceSMSOperation<T>(
	phoneNumber: string,
	fn: () => Promise<T>
): Promise<T> {
	return withSpan("sms.send", async (span: Span | NoopSpan) => {
		// Mask phone number for privacy (show only last 4 digits)
		const maskedPhone = phoneNumber.slice(0, -4).replace(/\d/g, "*") + phoneNumber.slice(-4);
		span.setAttribute("sms.phone_number", maskedPhone);

		const result = await fn();

		span.setAttribute("sms.sent", true);

		return result;
	});
}

/**
 * Trace a validation operation
 * @param validationType - Type of validation
 * @param fn - The validation function
 * @param attributes - Additional attributes
 * @returns Promise resolving to the validation result
 */
export async function traceValidation<T>(
	validationType: string,
	fn: () => Promise<T>,
	attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
	return withSpan(
		`validation.${validationType}`,
		async (span: Span | NoopSpan) => {
			const result = await fn();

			span.setAttribute("validation.passed", !!result);

			return result;
		},
		{
			"validation.type": validationType,
			...attributes
		}
	);
}
