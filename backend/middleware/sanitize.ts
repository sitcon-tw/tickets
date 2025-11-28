/**
 * @fileoverview Middleware for automatic input sanitization
 */

import { sanitizeObject } from "#utils/sanitize.js";
import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";

/**
 * Middleware to automatically sanitize request body
 * Prevents XSS attacks by removing potentially malicious HTML/scripts
 * @param allowHtml - Whether to allow safe HTML tags
 * @returns Fastify preHandler middleware
 */
export const sanitizeBody = (allowHtml: boolean = false): preHandlerHookHandler => {
	return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
		if (request.body && typeof request.body === "object") {
			request.body = sanitizeObject(request.body, allowHtml);
		}
	};
};

/**
 * Middleware to sanitize query parameters
 * @returns Fastify preHandler middleware
 */
export const sanitizeQuery = (): preHandlerHookHandler => {
	return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
		if (request.query && typeof request.query === "object") {
			request.query = sanitizeObject(request.query, false);
		}
	};
};

/**
 * Middleware to sanitize URL parameters
 * @returns Fastify preHandler middleware
 */
export const sanitizeParams = (): preHandlerHookHandler => {
	return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
		if (request.params && typeof request.params === "object") {
			request.params = sanitizeObject(request.params, false);
		}
	};
};
