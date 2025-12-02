/**
 * Authentication and authorization type definitions
 */

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: string;
	permissions: string[];
	isActive: boolean;
}

export interface AuthContext {
	user: SessionUser | null;
	sessionId: string | null;
	isAuthenticated: boolean;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export interface MagicLinkRequest {
	email: string;
}

export interface ResetPasswordRequest {
	email: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

export interface UserUpdateRequest {
	name?: string;
	email?: string;
	image?: string;
}

export type UserRole = "admin" | "viewer" | "eventAdmin";

export interface AdminUserUpdateRequest {
	name?: string;
	email?: string;
	role?: UserRole;
	permissions?: string[];
	isActive?: boolean;
}

/**
 * Permission types
 * Common permissions:
 * - 'users.read'
 * - 'users.write'
 * - 'events.read'
 * - 'events.write'
 * - 'registrations.read'
 * - 'registrations.write'
 * - 'analytics.read'
 * - 'admin.full'
 * For eventAdmin role, permissions array contains event IDs (e.g., ['event_id_1', 'event_id_2'])
 */
export type Permission = string;

export interface RolePermissions {
	admin: "admin";
	viewer: "viewer";
	eventAdmin: "eventAdmin";
}
