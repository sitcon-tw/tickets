/**
 * @fileoverview Middleware for automatic input sanitization
 */

import { sanitizeObject } from "#utils/sanitize.js";

/**
 * Middleware to automatically sanitize request body
 * Prevents XSS attacks by removing potentially malicious HTML/scripts
 * @param {boolean} allowHtml - Whether to allow safe HTML tags
 * @returns {Function} Fastify preHandler middleware
 */
export const sanitizeBody = (allowHtml = false) => {
	return async (request, reply) => {
		if (request.body && typeof request.body === 'object') {
			request.body = sanitizeObject(request.body, allowHtml);
		}
	};
};

/**
 * Middleware to sanitize query parameters
 * @returns {Function} Fastify preHandler middleware
 */
export const sanitizeQuery = () => {
	return async (request, reply) => {
		if (request.query && typeof request.query === 'object') {
			request.query = sanitizeObject(request.query, false);
		}
	};
};

/**
 * Middleware to sanitize URL parameters
 * @returns {Function} Fastify preHandler middleware
 */
export const sanitizeParams = () => {
	return async (request, reply) => {
		if (request.params && typeof request.params === 'object') {
			request.params = sanitizeObject(request.params, false);
		}
	};
};
