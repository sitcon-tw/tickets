import { z } from "zod";

/**
 * Authentication schemas
 */

// SessionUser schema
export const sessionUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	permissions: z.array(z.string()),
	isActive: z.boolean(),
});

// AuthContext schema
export const authContextSchema = z.object({
	user: sessionUserSchema.nullable(),
	sessionId: z.string().nullable(),
	isAuthenticated: z.boolean(),
});

// Request schemas
export const loginRequestSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const registerRequestSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const magicLinkRequestSchema = z.object({
	email: z.string().email("Invalid email address"),
	locale: z.enum(["zh-Hant", "zh-Hans", "en"]).optional(),
	returnUrl: z.string().optional(),
	turnstileToken: z.string().min(1, "Turnstile token is required"),
});

export const resetPasswordRequestSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export const changePasswordRequestSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const userUpdateRequestSchema = z.object({
	name: z.string().optional(),
	email: z.string().email().optional(),
	image: z.string().optional(),
});

// Note: AdminUserUpdateRequest is now exported from user.ts to avoid duplication

// Permission type
export const permissionSchema = z.string();

// RolePermissions schema
export const rolePermissionsSchema = z.object({
	admin: z.literal("admin"),
	viewer: z.literal("viewer"),
	eventAdmin: z.literal("eventAdmin"),
});

/**
 * Type exports
 */
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type AuthContext = z.infer<typeof authContextSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type UserUpdateRequest = z.infer<typeof userUpdateRequestSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type RolePermissions = z.infer<typeof rolePermissionsSchema>;
