import { z } from "zod";

/**
 * User schemas
 */

export const roleSchema = z.enum(["admin", "viewer", "eventAdmin"]);

export const userCreateSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	role: roleSchema,
	permissions: z.array(z.string()).optional(),
});

export const adminUserUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.email().optional(),
	role: roleSchema.optional(),
	permissions: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	image: z.url().optional(),
});

export const adminChangePasswordSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string().min(6),
});

/**
 * Type exports
 */
export type Role = z.infer<typeof roleSchema>;
export type UserCreateRequest = z.infer<typeof userCreateSchema>;
export type AdminUserUpdateRequest = z.infer<typeof adminUserUpdateSchema>;
export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>;
export type AdminChangePasswordRequest = z.infer<typeof adminChangePasswordSchema>;
