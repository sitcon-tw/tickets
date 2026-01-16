/**
 * Authentication and authorization types
 */

import { z } from "zod/v4";
import { UserRoleSchema } from "./common.js";
import { SessionUserSchema } from "./user.js";

/**
 * Auth context
 */
export const AuthContextSchema = z.object({
	user: SessionUserSchema.nullable(),
	sessionId: z.string().nullable(),
	isAuthenticated: z.boolean()
});
export type AuthContext = z.infer<typeof AuthContextSchema>;

/**
 * Login request
 */
export const LoginRequestSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6)
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Register request
 */
export const RegisterRequestSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(6)
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * Magic link request
 */
export const MagicLinkRequestSchema = z.object({
	email: z.string().email()
});
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;

/**
 * Reset password request
 */
export const ResetPasswordRequestSchema = z.object({
	email: z.string().email()
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * Change password request
 */
export const ChangePasswordRequestSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string().min(6)
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

/**
 * User update request (self-service)
 */
export const UserUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	image: z.string().optional()
});
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

/**
 * Admin user update request
 */
export const AdminUserUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	role: UserRoleSchema.optional(),
	permissions: z.array(z.string()).optional(),
	isActive: z.boolean().optional()
});
export type AdminUserUpdateRequest = z.infer<typeof AdminUserUpdateRequestSchema>;

/**
 * Session response
 */
export const SessionSchema = z.object({
	user: z.object({
		id: z.string(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
		email: z.string().email(),
		emailVerified: z.boolean(),
		name: z.string(),
		image: z.string().nullable().optional()
	}),
	session: z.object({
		id: z.string(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
		userId: z.string(),
		expiresAt: z.string().datetime(),
		token: z.string(),
		ipAddress: z.string().nullable().optional(),
		userAgent: z.string().nullable().optional()
	})
});
export type Session = z.infer<typeof SessionSchema>;
