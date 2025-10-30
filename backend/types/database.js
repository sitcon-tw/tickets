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
 * @property {Date|null} saleStart - Sale start date
 * @property {Date|null} saleEnd - Sale end date
 * @property {boolean} isActive - Whether ticket is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} InvitationCode
 * @property {string} id - Invitation code unique identifier
 * @property {string} ticketId - Associated ticket IDs
 * @property {string} code - The invitation code
 * @property {string|null} name - Code name/description
 * @property {number|null} usageLimit - Maximum usage limit
 * @property {number} usedCount - Current usage count
 * @property {Date|null} validFrom - Start date
 * @property {Date|null} validUntil - End date
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

/**
 * @typedef {Object} EventFormFields
 * @property {string} id - Form field unique identifier
 * @property {string} eventId - Associated event ID
 * @property {number} order - Field order in the form
 * @property {'text'|'textarea'|'select'|'checkbox'|'radio'} type - Field type
 * @property {string|null} validater - Validation regex pattern
 * @property {string} name - Field name
 * @property {string} description - Field description/label
 * @property {string|null} placeholder - Field placeholder text
 * @property {boolean} required - Whether field is required
 * @property {string|null} values - JSON array for select/radio options
 */

/**
 * @typedef {EventFormFields} TicketFromFields
 * @deprecated Use EventFormFields instead
 */

export {};
