/**
 * User and SMS verification types
 */

import { z } from "zod/v4";
import { UserRoleSchema } from "./common.js";

/**
 * SMS verification record
 */
export const SmsVerificationSchema = z.object({
	id: z.string(),
	userId: z.string(),
	phoneNumber: z.string(),
	code: z.string(),
	verified: z.boolean(),
	expiresAt: z.coerce.date(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});
export type SmsVerification = z.infer<typeof SmsVerificationSchema>;

/**
 * User entity
 */
export const UserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	emailVerified: z.boolean(),
	image: z.string().nullable().optional(),
	role: UserRoleSchema,
	/** Event IDs the user may manage (only used by roles that are not scoped to all events) */
	permissions: z.array(z.string()),
	/** Custom role, when `role` is "custom" */
	roleId: z.string().nullable().optional(),
	customRole: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
	isActive: z.boolean(),
	phoneNumber: z.string().nullable().optional(),
	phoneVerified: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	smsVerifications: z.array(SmsVerificationSchema).optional()
});
export type User = z.infer<typeof UserSchema>;

/**
 * Session user (simplified for session context)
 */
export const SessionUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	role: UserRoleSchema,
	permissions: z.array(z.string()),
	isActive: z.boolean()
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

/**
 * User capabilities based on role and permissions
 */
export const UserCapabilitiesSchema = z.object({
	canManageUsers: z.boolean(),
	canManageAllEvents: z.boolean(),
	canViewAnalytics: z.boolean(),
	canManageEmailCampaigns: z.boolean(),
	canManageReferrals: z.boolean(),
	canManageSmsLogs: z.boolean(),
	canManageSettings: z.boolean(),
	canManageRoles: z.boolean(),
	managedEventIds: z.array(z.string())
});
export type UserCapabilities = z.infer<typeof UserCapabilitiesSchema>;

/**
 * Permissions response
 */
export const PermissionsResponseSchema = z.object({
	role: UserRoleSchema,
	/** Event IDs the user may manage (legacy field name) */
	permissions: z.array(z.string()),
	/** Every permission the user has been granted, e.g. "registrations:export" */
	grantedPermissions: z.array(z.string()),
	/** Whether event-scoped permissions apply to every event */
	allEvents: z.boolean(),
	capabilities: UserCapabilitiesSchema
});
export type PermissionsResponse = z.infer<typeof PermissionsResponseSchema>;
