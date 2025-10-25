/**
 * @fileoverview Database operation tracing utilities
 * Provides manual tracing for Prisma database operations
 */

import { withSpan, addSpanEvent } from "#lib/tracing.js";

/**
 * Trace a Prisma database operation
 * @param {string} model - The Prisma model name (e.g., "User", "Event")
 * @param {string} operation - The operation name (e.g., "findUnique", "create", "update")
 * @param {Function} fn - The database operation function
 * @param {Object} queryParams - Query parameters for debugging (optional)
 * @returns {Promise<any>}
 */
export async function tracePrismaOperation(model, operation, fn, queryParams = {}) {
	const spanName = `prisma.${model}.${operation}`;
	
	return withSpan(
		spanName,
		async (span) => {
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
				"db.result.count": Array.isArray(result) ? result.length : (result ? 1 : 0)
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
 * @param {string} operation - The operation name (e.g., "get", "set", "del")
 * @param {string} key - The cache key
 * @param {Function} fn - The cache operation function
 * @returns {Promise<any>}
 */
export async function traceRedisOperation(operation, key, fn) {
	const spanName = `redis.${operation}`;
	
	return withSpan(
		spanName,
		async (span) => {
			span.setAttribute("db.system", "redis");
			span.setAttribute("db.operation", operation);
			span.setAttribute("db.redis.key", key);

			const startTime = Date.now();
			const result = await fn();
			const duration = Date.now() - startTime;

			span.setAttribute("db.query.duration_ms", duration);
			span.setAttribute("cache.hit", result !== null && result !== undefined);

			return result;
		}
	);
}

/**
 * Trace a business logic operation
 * @param {string} operationName - The operation name
 * @param {Function} fn - The operation function
 * @param {Object} attributes - Additional attributes
 * @returns {Promise<any>}
 */
export async function traceBusinessOperation(operationName, fn, attributes = {}) {
	return withSpan(
		operationName,
		async (span) => {
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
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {Function} fn - The email sending function
 * @returns {Promise<any>}
 */
export async function traceEmailOperation(recipient, subject, fn) {
	return withSpan(
		"email.send",
		async (span) => {
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
 * @param {string} phoneNumber - Phone number
 * @param {Function} fn - The SMS sending function
 * @returns {Promise<any>}
 */
export async function traceSMSOperation(phoneNumber, fn) {
	return withSpan(
		"sms.send",
		async (span) => {
			// Mask phone number for privacy (show only last 4 digits)
			const maskedPhone = phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
			span.setAttribute("sms.phone_number", maskedPhone);

			const result = await fn();

			span.setAttribute("sms.sent", true);

			return result;
		}
	);
}

/**
 * Trace a validation operation
 * @param {string} validationType - Type of validation
 * @param {Function} fn - The validation function
 * @param {Object} attributes - Additional attributes
 * @returns {Promise<any>}
 */
export async function traceValidation(validationType, fn, attributes = {}) {
	return withSpan(
		`validation.${validationType}`,
		async (span) => {
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
