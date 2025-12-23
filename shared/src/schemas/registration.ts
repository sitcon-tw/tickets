import { z } from "zod";

/**
 * Registration schemas
 */

export const registrationStatusSchema = z.enum([
	"pending",
	"confirmed",
	"cancelled",
	"waitlisted",
]);

export const registrationCreateSchema = z.object({
	eventId: z.cuid(),
	ticketId: z.cuid(),
	invitationCode: z.string().optional(),
	referralCode: z.string().optional(),
	formData: z.record(z.string(), z.any()),
});

export const registrationUpdateSchema = z.object({
	formData: z.record(z.string(), z.any()).optional(),
	status: registrationStatusSchema.optional(),
});

export const registrationExportQuerySchema = z.object({
	eventId: z.string().optional(),
	status: z.enum(["confirmed", "cancelled", "pending"]).optional(),
	format: z.enum(["csv", "excel"]).default("csv").optional(),
});

export const registrationDeleteParamsSchema = z.object({
	id: z.string(),
});

export const registrationGoogleSheetsSyncSchema = z.object({
	eventId: z.string(),
	sheetsUrl: z.string(),
});

/**
 * Type exports
 */
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;
export type RegistrationCreateRequest = z.infer<
	typeof registrationCreateSchema
>;
export type RegistrationUpdateRequest = z.infer<
	typeof registrationUpdateSchema
>;
export type RegistrationExportQuery = z.infer<
	typeof registrationExportQuerySchema
>;
export type RegistrationDeleteParams = z.infer<
	typeof registrationDeleteParamsSchema
>;
export type RegistrationGoogleSheetsSync = z.infer<
	typeof registrationGoogleSheetsSyncSchema
>;
