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
	expiresAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime()
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
	permissions: z.array(z.string()),
	isActive: z.boolean(),
	phoneNumber: z.string().nullable().optional(),
	phoneVerified: z.boolean(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
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
	managedEventIds: z.array(z.string())
});
export type UserCapabilities = z.infer<typeof UserCapabilitiesSchema>;

/**
 * Permissions response
 */
export const PermissionsResponseSchema = z.object({
	role: UserRoleSchema,
	permissions: z.array(z.string()),
	capabilities: UserCapabilitiesSchema
});
export type PermissionsResponse = z.infer<typeof PermissionsResponseSchema>;
