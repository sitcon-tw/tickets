import { apiClient } from './api/client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Analytics API
export const analytics = {
  getDashboard: () => apiClient.get<ApiResponse>('/api/admin/dashboard'),
  getRegistrationTrends: (params?: { eventId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse>('/api/admin/analytics/registration-trends', params),
  getTicketAnalytics: (eventId: string) =>
    apiClient.get<ApiResponse>(`/api/admin/analytics/tickets/${eventId}`),
};

// Events API
export const events = {
  list: (params?: { isActive?: boolean }) =>
    apiClient.get<ApiResponse>('/api/admin/events', params),
  get: (id: string) =>
    apiClient.get<ApiResponse>(`/api/admin/events/${id}`),
  create: (data: any) =>
    apiClient.post<ApiResponse>('/api/admin/events', data),
  update: (id: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/events/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/api/admin/events/${id}`),
};

// Tickets API
export const tickets = {
  list: (eventId: string) =>
    apiClient.get<ApiResponse>(`/api/admin/events/${eventId}/tickets`),
  get: (eventId: string, ticketId: string) =>
    apiClient.get<ApiResponse>(`/api/admin/events/${eventId}/tickets/${ticketId}`),
  create: (eventId: string, data: any) =>
    apiClient.post<ApiResponse>(`/api/admin/events/${eventId}/tickets`, data),
  update: (eventId: string, ticketId: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/events/${eventId}/tickets/${ticketId}`, data),
  delete: (eventId: string, ticketId: string) =>
    apiClient.delete<ApiResponse>(`/api/admin/events/${eventId}/tickets/${ticketId}`),
};

// Form Fields API
export const formFields = {
  list: (ticketId: string) =>
    apiClient.get<ApiResponse>(`/api/admin/tickets/${ticketId}/form-fields`),
  get: (ticketId: string, fieldId: string) =>
    apiClient.get<ApiResponse>(`/api/admin/tickets/${ticketId}/form-fields/${fieldId}`),
  create: (data: any) =>
    apiClient.post<ApiResponse>('/api/admin/form-fields', data),
  update: (fieldId: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/form-fields/${fieldId}`, data),
  delete: (fieldId: string) =>
    apiClient.delete<ApiResponse>(`/api/admin/form-fields/${fieldId}`),
  reorder: (ticketId: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/tickets/${ticketId}/form-fields/reorder`, data),
};

// Registrations API
export const registrations = {
  list: (params?: { eventId?: string; status?: string; search?: string; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse>('/api/admin/registrations', params),
  get: (id: string) =>
    apiClient.get<ApiResponse>(`/api/admin/registrations/${id}`),
  update: (id: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/registrations/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/api/admin/registrations/${id}`),
  export: (params?: { format?: string; eventId?: string }) =>
    apiClient.get<ApiResponse>('/api/admin/registrations/export', params),
};

// Invitation Codes API
export const invitationCodes = {
  list: (params?: { ticketId?: string; status?: string; limit?: number }) =>
    apiClient.get<ApiResponse>('/api/admin/invitation-codes', params),
  get: (id: string) =>
    apiClient.get<ApiResponse>(`/api/admin/invitation-codes/${id}`),
  create: (data: any) =>
    apiClient.post<ApiResponse>('/api/admin/invitation-codes', data),
  bulkCreate: (data: { type: string; count: number; usageLimit?: number; expiresAt?: string }) =>
    apiClient.post<ApiResponse>('/api/admin/invitation-codes/bulk', data),
  update: (id: string, data: any) =>
    apiClient.put<ApiResponse>(`/api/admin/invitation-codes/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/api/admin/invitation-codes/${id}`),
  export: (params?: { format?: string }) =>
    apiClient.get<ApiResponse>('/api/admin/invitation-codes/export', params),
};

// Email Campaigns API
export const emailCampaigns = {
  list: () =>
    apiClient.get<ApiResponse>('/api/admin/email-campaigns'),
  get: (id: string) =>
    apiClient.get<ApiResponse>(`/api/admin/email-campaigns/${id}`),
  create: (data: any) =>
    apiClient.post<ApiResponse>('/api/admin/email-campaigns', data),
  send: (id: string) =>
    apiClient.post<ApiResponse>(`/api/admin/email-campaigns/${id}/send`),
};
