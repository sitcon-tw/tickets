/**
 * Authentication and authorization types
 */

import { z } from "zod/v4";
import { UserRoleSchema } from "./common.js";

/**
 * Admin user update request
 */
export const AdminUserUpdateRequestSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.email().optional(),
	role: UserRoleSchema.optional(),
	permissions: z.array(z.string()).optional(),
	roleId: z.string().nullable().optional(),
	isActive: z.boolean().optional()
});
export type AdminUserUpdateRequest = z.infer<typeof AdminUserUpdateRequestSchema>;

/**
 * Session response
 */
export const SessionSchema = z.object({
	user: z.object({
		id: z.string(),
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		email: z.email(),
		emailVerified: z.boolean(),
		name: z.string(),
		image: z.string().nullable().optional()
	}),
	session: z.object({
		id: z.string(),
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		userId: z.string(),
		expiresAt: z.coerce.date(),
		token: z.string(),
		ipAddress: z.string().nullable().optional(),
		userAgent: z.string().nullable().optional()
	})
});
export type Session = z.infer<typeof SessionSchema>;

/**
 * Passkey (WebAuthn credential) as returned by /api/auth/passkey/list-user-passkeys
 */
export const PasskeySchema = z.object({
	id: z.string(),
	name: z.string().nullable().optional(),
	deviceType: z.string(),
	backedUp: z.boolean(),
	aaguid: z.string().nullable().optional(),
	createdAt: z.coerce.date().nullable().optional()
});
export type Passkey = z.infer<typeof PasskeySchema>;
