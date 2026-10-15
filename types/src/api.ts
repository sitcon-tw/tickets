/**
 * API response types and pagination schemas
 */

import { z } from "zod/v4";

/**
 * Pagination metadata (response side, so `limit` is whatever the request asked for)
 */
export const PaginationSchema = z.object({
	page: z.number().int().min(1),
	limit: z.number().int().min(1),
	total: z.number().int().min(0),
	totalPages: z.number().int().min(0),
	hasNext: z.boolean(),
	hasPrev: z.boolean()
});
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Standard API response wrapper. List endpoints also carry `pagination`.
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: dataSchema,
		pagination: PaginationSchema.optional()
	});

/**
 * Generic API response type (matches `ApiResponseSchema`)
 */
export type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
	pagination?: Pagination;
};

/**
 * API error response
 */
export const ApiErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.unknown().optional()
	})
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Paginated list response: `data` is an array of `itemSchema` and `pagination` is required
 */
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: z.array(itemSchema),
		pagination: PaginationSchema
	});
