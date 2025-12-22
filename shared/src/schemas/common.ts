import { z } from "zod";

/**
 * Common API Response schemas
 */

export const paginationSchema = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
	hasNext: z.boolean(),
	hasPrev: z.boolean(),
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		message: z.string(),
		data: dataSchema,
		pagination: paginationSchema.nullable().optional(),
	});

export const apiErrorSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.any().optional(),
});

export const apiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: apiErrorSchema,
});

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1).optional(),
	limit: z.coerce.number().int().positive().max(100).default(10).optional(),
});

export const sortOrderSchema = z.enum(["asc", "desc"]);

export const searchQuerySchema = z.object({
	q: z.string().optional(),
	sortBy: z.string().optional(),
	sortOrder: sortOrderSchema.optional(),
	filters: z.record(z.string(), z.any()).optional(),
});

/**
 * Common field types
 */
export const localizedTextSchema = z.record(z.string(), z.string());

/**
 * Infer TypeScript types from schemas
 */
export type Pagination = z.infer<typeof paginationSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export type ApiResponse<T> = {
	success: boolean;
	message: string;
	data: T;
	pagination?: Pagination | null;
};
