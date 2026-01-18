/**
 * API response types and pagination schemas
 */

import { z } from "zod/v4";
import { SortOrderSchema } from "./common.js";

/**
 * Standard API response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: dataSchema
	});

/**
 * Generic API response type
 */
export type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
	pagination?: Pagination | null;
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
 * Pagination metadata
 */
export const PaginationSchema = z.object({
	page: z.number().int().min(1),
	limit: z.number().int().min(1).max(100),
	total: z.number().int().min(0),
	totalPages: z.number().int().min(0),
	hasNext: z.boolean(),
	hasPrev: z.boolean()
});
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Paginated response wrapper
 */
export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: z.array(dataSchema),
		pagination: PaginationSchema.optional()
	});

/**
 * Pagination query parameters
 */
export const PaginationQuerySchema = z.object({
	page: z.number().int().min(1).optional().default(1),
	limit: z.number().int().min(1).max(100).optional().default(10)
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Search query parameters
 */
export const SearchQuerySchema = z.object({
	q: z.string().optional(),
	sortBy: z.string().optional(),
	sortOrder: SortOrderSchema.optional(),
	filters: z.record(z.string(), z.unknown()).optional()
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
