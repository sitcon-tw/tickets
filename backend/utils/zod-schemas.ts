/**
 * Utility to convert shared Zod schemas to Fastify-compatible schemas
 */

import {
	apiErrorResponseSchema,
	paginationSchema,
	type ApiResponse,
} from "@tickets/shared";
import type { FastifySchema } from "fastify";
import { z, type ZodType } from "zod";

/**
 * Create a Fastify schema from Zod schemas
 * This allows us to use Zod for validation while maintaining Fastify's schema format
 */
export function createFastifySchema<TBody extends ZodType = ZodType, TQuerystring extends ZodType = ZodType, TParams extends ZodType = ZodType, TResponse extends Record<number, ZodType> = Record<number, ZodType>>(config: {
	description?: string;
	tags?: string[];
	body?: TBody;
	querystring?: TQuerystring;
	params?: TParams;
	response?: TResponse;
	summary?: string;
}): FastifySchema {
	const schema: FastifySchema = {};

	if (config.description) schema.description = config.description;
	if (config.tags) schema.tags = config.tags;
	if (config.summary) schema.summary = config.summary;

	// Fastify will validate using the Zod schemas directly
	// when using fastify-type-provider-zod
	if (config.body) schema.body = config.body;
	if (config.querystring) schema.querystring = config.querystring;
	if (config.params) schema.params = config.params;
	if (config.response) schema.response = config.response;

	return schema;
}

/**
 * Helper to create standard API response schemas
 */
export function createApiResponseSchema<T extends ZodType>(dataSchema: T) {
	return z.object({
		success: z.boolean(),
		message: z.string(),
		data: dataSchema,
		pagination: paginationSchema.nullable().optional(),
	});
}

/**
 * Standard response schemas for common status codes
 */
export const standardResponses = {
	200: createApiResponseSchema(z.any()),
	201: createApiResponseSchema(z.any()),
	400: apiErrorResponseSchema,
	401: apiErrorResponseSchema,
	403: apiErrorResponseSchema,
	404: apiErrorResponseSchema,
	409: apiErrorResponseSchema,
	500: apiErrorResponseSchema,
} as const;

/**
 * Helper type for API response
 */
export type { ApiResponse };
