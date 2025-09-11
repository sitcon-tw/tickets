/**
 * @fileoverview Database model type definitions
 * Based on Prisma schema models
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {boolean} emailVerified - Whether email is verified
 * @property {string|null} image - User's profile image URL
 * @property {'admin'|'checkin'|'viewer'} role - User's role
 * @property {string|null} permissions - JSON array of permissions
 * @property {boolean} isActive - Whether user is active
 * @property {Date} createdAt - User creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Event
 * @property {string} id - Event unique identifier
 * @property {string} name - Event name
 * @property {string|null} description - Event description
 * @property {string|null} location - Event location
 * @property {Date} startDate - Event start date
 * @property {Date} endDate - Event end date
 * @property {string|null} ogImage - Open Graph image URL
 * @property {string|null} landingPage - JSON content for landing page
 * @property {boolean} isActive - Whether event is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Registration
 * @property {string} id - Registration unique identifier
 * @property {string} userId - User ID
 * @property {string} eventId - Event ID
 * @property {string} ticketId - Ticket ID
 * @property {string|null} invitationCodeId - Invitation code used
 * @property {string|null} referralCodeId - Referral code used
 * @property {string} formData - JSON form data
 * @property {'pending'|'confirmed'|'cancelled'} status - Registration status
 * @property {Date|null} checkinAt - Check-in timestamp
 * @property {string|null} tags - JSON array of tags
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id - Ticket unique identifier
 * @property {string} eventId - Event ID
 * @property {string} name - Ticket name
 * @property {string|null} description - Ticket description
 * @property {number} price - Ticket price
 * @property {number} quantity - Available quantity
 * @property {number} sold - Number sold
 * @property {Date|null} saleStartDate - Sale start date
 * @property {Date|null} saleEndDate - Sale end date
 * @property {boolean} isActive - Whether ticket is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} FormField
 * @property {string} id - Form field unique identifier
 * @property {string} eventId - Event ID
 * @property {string} name - Field name/key
 * @property {string} label - Display label
 * @property {'text'|'email'|'phone'|'textarea'|'select'|'radio'|'checkbox'} type - Field type
 * @property {boolean} isRequired - Whether field is required
 * @property {string|null} options - JSON array of options for select/radio
 * @property {string|null} validation - JSON validation rules
 * @property {number} order - Display order
 * @property {boolean} isActive - Whether field is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} InvitationCode
 * @property {string} id - Invitation code unique identifier
 * @property {string} eventId - Event ID
 * @property {string} code - The invitation code
 * @property {string|null} description - Code description
 * @property {number|null} usageLimit - Maximum usage limit
 * @property {number} usageCount - Current usage count
 * @property {Date|null} expiresAt - Expiration date
 * @property {boolean} isActive - Whether code is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Referral
 * @property {string} id - Referral unique identifier
 * @property {string} eventId - Event ID
 * @property {string} userId - User ID who created the referral
 * @property {string} code - Referral code
 * @property {string|null} description - Referral description
 * @property {boolean} isActive - Whether referral is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} ReferralUsage
 * @property {string} id - Usage unique identifier
 * @property {string} referralId - Referral ID
 * @property {string} eventId - Event ID
 * @property {string} userId - User ID who used the referral
 * @property {Date} usedAt - Usage timestamp
 */

/**
 * @typedef {Object} EmailCampaign
 * @property {string} id - Campaign unique identifier
 * @property {string} name - Campaign name
 * @property {string} subject - Email subject
 * @property {string} content - Email content
 * @property {string|null} eventId - Event ID (if event-specific)
 * @property {string|null} targetAudience - JSON filter criteria
 * @property {'draft'|'sent'|'scheduled'} status - Campaign status
 * @property {Date|null} scheduledAt - Scheduled send time
 * @property {Date|null} sentAt - Actual send time
 * @property {number} recipientCount - Number of recipients
 * @property {string} createdBy - User ID who created campaign
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

export {}