// Admin utilities for frontend
const BACKEND_URI = 'http://localhost:3000';

/**
 * Generic API request function with admin authentication
 */
async function adminApiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BACKEND_URI}/api/admin${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login/';
        throw new Error('Authentication required');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Admin API request failed:', error);
    throw error;
  }
}

/**
 * Check if user has admin access
 */
export async function checkAdminAuth() {
  try {
    // First check if user is logged in
    const sessionResponse = await fetch(`${BACKEND_URI}/api/auth/get-session`, {
      credentials: 'include',
    });
    
    if (!sessionResponse.ok) {
      redirectToLogin();
      return false;
    }
    
    const session = await sessionResponse.json();
    
    if (!session.user) {
      redirectToLogin();
      return false;
    }
    
    // Now check if user has admin role by making a request to an admin endpoint
    // This will return 403 if user doesn't have admin role
    try {
      const adminResponse = await fetch(`${BACKEND_URI}/api/admin/dashboard`, {
        credentials: 'include',
      });
      
      if (adminResponse.status === 403) {
        alert('權限不足，您沒有管理員權限');
        window.location.href = '/';
        return false;
      }
      
      if (adminResponse.status === 401) {
        redirectToLogin();
        return false;
      }
      
      // If we get here, user has admin access
      return true;
      
    } catch (adminError) {
      console.error('Admin access check failed:', adminError);
      alert('權限檢查失敗，請重新整理頁面');
      return false;
    }
    
  } catch (error) {
    console.error('Admin auth check failed:', error);
    redirectToLogin();
    return false;
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  window.location.href = '/login/';
}

// Analytics API
export const analytics = {
  /**
   * Get dashboard data
   */
  getDashboard: () => adminApiRequest('/dashboard'),

  /**
   * Get referral analytics
   */
  getReferrals: () => adminApiRequest('/referrals'),

  /**
   * Get trends data
   */
  getTrends: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiRequest(`/trends${queryString ? `?${queryString}` : ''}`);
  }
};

// Registrations API
export const registrations = {
  /**
   * Get registrations list with filtering and pagination
   */
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiRequest(`/registrations${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single registration by ID
   */
  get: (id) => adminApiRequest(`/registrations/${id}`),

  /**
   * Update registration
   */
  update: (id, data) => adminApiRequest(`/registrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete registration
   */
  delete: (id) => adminApiRequest(`/registrations/${id}`, {
    method: 'DELETE',
  }),

  /**
   * Update registration status
   */
  updateStatus: (id, status) => adminApiRequest(`/registrations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  /**
   * Export registrations
   */
  export: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiRequest(`/registrations/export${queryString ? `?${queryString}` : ''}`);
  }
};

// Tickets API
export const tickets = {
  /**
   * Get tickets list
   */
  list: (eventId) => {
    const params = eventId ? `?eventId=${eventId}` : '';
    return adminApiRequest(`/tickets${params}`);
  },

  /**
   * Create new ticket
   */
  create: (data) => adminApiRequest('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update ticket
   */
  update: (ticketId, data) => adminApiRequest(`/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete ticket
   */
  delete: (ticketId) => adminApiRequest(`/tickets/${ticketId}`, {
    method: 'DELETE',
  })
};

// Events API
export const events = {
  /**
   * Get events list
   */
  list: () => adminApiRequest('/events'),

  /**
   * Get single event
   */
  get: (id) => adminApiRequest(`/events/${id}`),

  /**
   * Create new event
   */
  create: (data) => adminApiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update event
   */
  update: (id, data) => adminApiRequest(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete event
   */
  delete: (id) => adminApiRequest(`/events/${id}`, {
    method: 'DELETE',
  })
};

// Form Fields API
export const formFields = {
  /**
   * Get form fields for a ticket
   */
  list: (ticketId) => {
    const params = ticketId ? `?ticketId=${ticketId}` : '';
    return adminApiRequest(`/ticket-form-fields${params}`);
  },

  /**
   * Create new form field
   */
  create: (data) => adminApiRequest('/ticket-form-fields', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update form field
   */
  update: (fieldId, data) => adminApiRequest(`/ticket-form-fields/${fieldId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete form field
   */
  delete: (fieldId) => adminApiRequest(`/ticket-form-fields/${fieldId}`, {
    method: 'DELETE',
  }),

  /**
   * Reorder form fields
   */
  reorder: (fieldOrders) => adminApiRequest('/ticket-form-fields/reorder', {
    method: 'PUT',
    body: JSON.stringify({ fieldOrders }),
  })
};

// Invitation Codes API
export const invitationCodes = {
  /**
   * Get invitation codes list
   */
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiRequest(`/invitation-codes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Create new invitation code
   */
  create: (data) => adminApiRequest('/invitation-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update invitation code
   */
  update: (id, data) => adminApiRequest(`/invitation-codes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete invitation code
   */
  delete: (id) => adminApiRequest(`/invitation-codes/${id}`, {
    method: 'DELETE',
  }),

  /**
   * Bulk create invitation codes
   */
  bulkCreate: (data) => adminApiRequest('/invitation-codes/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  })
};

// Users API
export const users = {
  /**
   * Get users list
   */
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiRequest(`/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Update user role
   */
  updateRole: (id, role) => adminApiRequest(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
};

/**
 * Initialize admin page with auth check
 */
export async function initializeAdminPage() {
  const isAuthorized = await checkAdminAuth();
  if (!isAuthorized) {
    return false;
  }
  return true;
}
export function initAdminPage() {
  document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
  });
}