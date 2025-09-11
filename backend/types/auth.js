/**
 * @fileoverview Authentication and authorization type definitions
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id - User ID
 * @property {string} name - User's name
 * @property {string} email - User's email
 * @property {string} role - User's role
 * @property {string[]} permissions - User's permissions
 * @property {boolean} isActive - Whether user is active
 */

/**
 * @typedef {Object} AuthContext
 * @property {SessionUser|null} user - Current authenticated user
 * @property {string|null} sessionId - Session ID
 * @property {boolean} isAuthenticated - Whether user is authenticated
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email - User's email
 * @property {string} password - User's password
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name - User's name
 * @property {string} email - User's email
 * @property {string} password - User's password
 */

/**
 * @typedef {Object} MagicLinkRequest
 * @property {string} email - User's email
 */

/**
 * @typedef {Object} ResetPasswordRequest
 * @property {string} email - User's email
 */

/**
 * @typedef {Object} ChangePasswordRequest
 * @property {string} currentPassword - Current password
 * @property {string} newPassword - New password
 */

/**
 * @typedef {Object} UserUpdateRequest
 * @property {string} [name] - User's name
 * @property {string} [email] - User's email
 * @property {string} [image] - User's profile image URL
 */

/**
 * @typedef {Object} AdminUserUpdateRequest
 * @property {string} [name] - User's name
 * @property {string} [email] - User's email
 * @property {'admin'|'checkin'|'viewer'} [role] - User's role
 * @property {string[]} [permissions] - User's permissions
 * @property {boolean} [isActive] - Whether user is active
 */

/**
 * @typedef {'admin'|'checkin'|'viewer'} UserRole
 */

/**
 * @typedef {string} Permission
 * Common permissions:
 * - 'users.read'
 * - 'users.write'
 * - 'events.read'
 * - 'events.write'
 * - 'registrations.read'
 * - 'registrations.write'
 * - 'analytics.read'
 * - 'checkin.perform'
 * - 'admin.full'
 */

/**
 * @typedef {Object} RolePermissions
 * @property {'admin'} admin - Full administrative access
 * @property {'checkin'} checkin - Check-in operations access
 * @property {'viewer'} viewer - Read-only access
 */

export {}