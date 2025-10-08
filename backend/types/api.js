/**
 * @fileoverview API request/response type definitions
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {*} data - Response data
 * @property {Pagination|null} [pagination] - Pagination info for paginated responses
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} success - Always false for error responses
 * @property {ApiError} error - Error details
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {*} [details] - Additional error details
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} total - Total number of items
 * @property {number} totalPages - Total number of pages
 * @property {boolean} hasNext - Whether there's a next page
 * @property {boolean} hasPrev - Whether there's a previous page
 */

/**
 * @typedef {Object} PaginationQuery
 * @property {number} [page=1] - Page number
 * @property {number} [limit=10] - Items per page
 */

/**
 * @typedef {Object} EventCreateRequest
 * @property {string} name - Event name
 * @property {string} [description] - Event description
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {string} [location] - Event location
 */

/**
 * @typedef {Object} EventUpdateRequest
 * @property {string} [name] - Event name
 * @property {string} [description] - Event description
 * @property {string} [startDate] - ISO date string
 * @property {string} [endDate] - ISO date string
 * @property {string} [location] - Event location
 * @property {boolean} [isActive] - Whether event is active
 */

/**
 * @typedef {Object} RegistrationCreateRequest
 * @property {string} eventId - Event ID
 * @property {string} ticketId - Ticket ID
 * @property {string} [invitationCode] - Invitation code
 * @property {string} [referralCode] - Referral code
 * @property {Object.<string, any>} formData - Form data keyed by field names
 */

/**
 * @typedef {Object} RegistrationUpdateRequest
 * @property {Object} [formData] - Updated form data
 * @property {'pending'|'confirmed'|'cancelled'} [status] - Registration status
 * @property {string[]} [tags] - Registration tags
 */

/**
 * @typedef {Object} TicketCreateRequest
 * @property {string} eventId - Event ID
 * @property {string} name - Ticket name
 * @property {string} [description] - Ticket description
 * @property {number} price - Ticket price
 * @property {number} quantity - Available quantity
 * @property {string} [saleStart] - ISO date string
 * @property {string} [saleEnd] - ISO date string
 * @property {boolean} [requireInviteCode] - Whether invitation code is required
 */

/**
 * @typedef {Object} TicketUpdateRequest
 * @property {string} [name] - Ticket name
 * @property {string} [description] - Ticket description
 * @property {number} [price] - Ticket price
 * @property {number} [quantity] - Available quantity
 * @property {string} [saleStart] - ISO date string
 * @property {string} [saleEnd] - ISO date string
 * @property {boolean} [isActive] - Whether ticket is active
 * @property {boolean} [requireInviteCode] - Whether invitation code is required
 */

/**
 * @typedef {Object} InvitationCodeCreateRequest
 * @property {string} eventId - Event ID
 * @property {string} code - The invitation code
 * @property {string} [name] - Code name/description
 * @property {number} [usageLimit] - Maximum usage limit
 * @property {string} [validFrom] - ISO date string for start time
 * @property {string} [validUntil] - ISO date string for end time
 * @property {string} [ticketId] - Associated ticket ID
 */

/**
 * @typedef {Object} InvitationCode
 * @property {string} id - Unique identifier
 * @property {string} eventId - Associated event ID
 * @property {string} code - The invitation code
 * @property {string} name - Code name/description
 * @property {number} usageLimit - Maximum usage limit
 * @property {number} usedCount - Current usage count
 * @property {string|null} validFrom - ISO date string for start time
 * @property {string|null} validUntil - ISO date string for end time
 * @property {boolean} isActive - Whether code is active
 * @property {string} ticketId - Associated ticket ID
 * @property {string} createdAt - ISO date string for creation time
 * @property {string} updatedAt - ISO date string for last update time
 */

/**
 * @typedef {Object} InvitationCodeUpdateRequest
 * @property {string} [code] - The invitation code
 * @property {string} [name] - Code name/description
 * @property {number} [usageLimit] - Maximum usage limit
 * @property {string} [validFrom] - ISO date string for start time
 * @property {string} [validUntil] - ISO date string for end time
 * @property {boolean} [isActive] - Whether code is active
 * @property {string} [ticketId] - Associated ticket ID
 */

/**
 * @typedef {Object} EmailCampaignCreateRequest
 * @property {string} name - Campaign name
 * @property {string} subject - Email subject
 * @property {string} content - Email content
 * @property {string} [eventId] - Event ID (if event-specific)
 * @property {TargetAudience} [targetAudience] - Target audience filter
 * @property {string} [scheduledAt] - ISO date string for scheduled sending
 */

/**
 * @typedef {Object} TargetAudience
 * @property {string[]} [roles] - User roles to target
 * @property {string[]} [eventIds] - Event IDs to target registrations from
 * @property {string[]} [registrationStatuses] - Registration statuses to target
 * @property {string[]} [tags] - Registration tags to target
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} [q] - Search query string
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc'|'desc'} [sortOrder] - Sort order
 * @property {Object} [filters] - Additional filters
 */

/**
 * @typedef {Object} AnalyticsData
 * @property {number} totalRegistrations - Total registrations count
 * @property {number} confirmedRegistrations - Confirmed registrations count
 * @property {number} pendingRegistrations - Pending registrations count
 * @property {number} cancelledRegistrations - Cancelled registrations count
 * @property {number} checkedInCount - Checked in count
 * @property {Object} registrationsByDate - Registrations grouped by date
 * @property {Object} ticketSales - Ticket sales data
 * @property {Object} referralStats - Referral statistics
 */

/**
 * @typedef {Object} TicketFormFieldCreateRequest
 * @property {string} ticketId - Associated ticket ID
 * @property {number} order - Field order in the form
 * @property {'text'|'textarea'|'select'|'checkbox'|'radio'} type - Field type
 * @property {string} [validater] - Validation regex pattern
 * @property {string} name - Field name
 * @property {string} description - Field description/label
 * @property {string} [placeholder] - Field placeholder text
 * @property {boolean} [required] - Whether field is required
 * @property {string} [values] - JSON array for select/radio options
 */

/**
 * @typedef {Object} TicketFormFieldUpdateRequest
 * @property {number} [order] - Field order in the form
 * @property {'text'|'textarea'|'select'|'checkbox'|'radio'} [type] - Field type
 * @property {string} [validater] - Validation regex pattern
 * @property {string} [name] - Field name
 * @property {string} [description] - Field description/label
 * @property {string} [placeholder] - Field placeholder text
 * @property {boolean} [required] - Whether field is required
 * @property {string} [values] - JSON array for select/radio options
 */

export {};
