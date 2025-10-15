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
 * @property {'admin'|'viewer'|'eventAdmin'} [role] - User's role
 * @property {string[]} [permissions] - User's permissions (for eventAdmin, contains event IDs they can manage)
 * @property {boolean} [isActive] - Whether user is active
 */

/**
 * @typedef {'admin'|'viewer'|'eventAdmin'} UserRole
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
 * - 'admin.full'
 * For eventAdmin role, permissions array contains event IDs (e.g., ['event_id_1', 'event_id_2'])
 */

/**
 * @typedef {Object} RolePermissions
 * @property {'admin'} admin - Full administrative access
 * @property {'viewer'} viewer - Read-only access
 * @property {'eventAdmin'} eventAdmin - Can view/edit specific events only (event IDs stored in permissions array)
 */

export {};
