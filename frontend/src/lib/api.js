// API utilities for frontend
import { apiRequest } from "./auth.js";

/**
 * Event API calls
 */
export const events = {
	// Get all active events
	async list() {
		return apiRequest("/events");
	},

	// Get event info by ID
	async getInfo(eventId) {
		return apiRequest(`/events/${eventId}/info`);
	},

	// Get tickets for an event
	async getTickets(eventId) {
		return apiRequest(`/events/${eventId}/tickets`);
	},

	// Get event statistics
	async getStats(eventId) {
		return apiRequest(`/events/${eventId}/stats`);
	}
};

/**
 * Registration API calls
 */
export const registrations = {
	// Create new registration
	async create(registrationData) {
		return apiRequest("/registrations", {
			method: "POST",
			body: JSON.stringify(registrationData)
		});
	},

	// Get user's registrations
	async getUserRegistrations() {
		return apiRequest("/registrations");
	},

	// Update registration
	async update(registrationId, updateData) {
		return apiRequest(`/registrations/${registrationId}`, {
			method: "PUT",
			body: JSON.stringify(updateData)
		});
	},

	// Cancel registration
	async cancel(registrationId) {
		return apiRequest(`/registrations/${registrationId}`, {
			method: "DELETE"
		});
	}
};

/**
 * Referral API calls
 */
export const referrals = {
	// Get user's referral code
	async getUserCode() {
		return apiRequest("/referrals");
	},

	// Create referral code
	async create() {
		return apiRequest("/referrals", {
			method: "POST"
		});
	}
};

/**
 * Invitation Code API calls
 */
export const invitations = {
	// Validate invitation code
	async validate(code) {
		return apiRequest("/invitation-codes/validate", {
			method: "POST",
			body: JSON.stringify({ code })
		});
	},

	// Use invitation code
	async use(code) {
		return apiRequest("/invitation-codes/use", {
			method: "POST",
			body: JSON.stringify({ code })
		});
	}
};

/**
 * Admin API calls
 */
export const admin = {
	// Users
	users: {
		async list(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/users?${searchParams}`);
		},

		async get(userId) {
			return apiRequest(`/admin/users/${userId}`);
		},

		async update(userId, userData) {
			return apiRequest(`/admin/users/${userId}`, {
				method: "PUT",
				body: JSON.stringify(userData)
			});
		},

		async delete(userId) {
			return apiRequest(`/admin/users/${userId}`, {
				method: "DELETE"
			});
		}
	},

	// Events
	events: {
		async list(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/events?${searchParams}`);
		},

		async create(eventData) {
			return apiRequest("/admin/events", {
				method: "POST",
				body: JSON.stringify(eventData)
			});
		},

		async update(eventId, eventData) {
			return apiRequest(`/admin/events/${eventId}`, {
				method: "PUT",
				body: JSON.stringify(eventData)
			});
		},

		async delete(eventId) {
			return apiRequest(`/admin/events/${eventId}`, {
				method: "DELETE"
			});
		}
	},

	// Tickets
	tickets: {
		async list(eventId, params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/tickets?eventId=${eventId}&${searchParams}`);
		},

		async create(ticketData) {
			return apiRequest("/admin/tickets", {
				method: "POST",
				body: JSON.stringify(ticketData)
			});
		},

		async update(ticketId, ticketData) {
			return apiRequest(`/admin/tickets/${ticketId}`, {
				method: "PUT",
				body: JSON.stringify(ticketData)
			});
		},

		async delete(ticketId) {
			return apiRequest(`/admin/tickets/${ticketId}`, {
				method: "DELETE"
			});
		}
	},

	// Registrations
	registrations: {
		async list(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/registrations?${searchParams}`);
		},

		async get(registrationId) {
			return apiRequest(`/admin/registrations/${registrationId}`);
		},

		async update(registrationId, registrationData) {
			return apiRequest(`/admin/registrations/${registrationId}`, {
				method: "PUT",
				body: JSON.stringify(registrationData)
			});
		},

		async updateStatus(registrationId, status) {
			return apiRequest(`/admin/registrations/${registrationId}/status`, {
				method: "PUT",
				body: JSON.stringify({ status })
			});
		}
	},

	// Invitation codes
	invitationCodes: {
		async list(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/invitation-codes?${searchParams}`);
		},

		async create(codeData) {
			return apiRequest("/admin/invitation-codes", {
				method: "POST",
				body: JSON.stringify(codeData)
			});
		},

		async update(codeId, codeData) {
			return apiRequest(`/admin/invitation-codes/${codeId}`, {
				method: "PUT",
				body: JSON.stringify(codeData)
			});
		},

		async delete(codeId) {
			return apiRequest(`/admin/invitation-codes/${codeId}`, {
				method: "DELETE"
			});
		}
	},

	// Analytics
	analytics: {
		async getDashboard(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/analytics/dashboard?${searchParams}`);
		},

		async getReferralAnalytics(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/analytics/referrals?${searchParams}`);
		},

		async getTrends(params = {}) {
			const searchParams = new URLSearchParams(params);
			return apiRequest(`/admin/analytics/trends?${searchParams}`);
		}
	}
};
