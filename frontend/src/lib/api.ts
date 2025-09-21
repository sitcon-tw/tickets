// Prefer Vite dev proxy (relative /api) unless an explicit backend base is given
const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URI as string | undefined)?.replace(/\/$/, '')
const API_BASE = BACKEND_BASE ? `${BACKEND_BASE}/api` : '/api'

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  auth: {
    async getSession() {
  const res = await fetch(`${API_BASE}/auth/get-session`, { credentials: 'include' })
      if (!res.ok) return null
      return res.json()
    },
    async sendMagicLink(email: string) {
  const res = await fetch(`${API_BASE}/auth/sign-in/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          callbackURL: `${window.location.origin}/`,
          newUserCallbackURL: `${window.location.origin}/`,
          errorCallbackURL: `${window.location.origin}/login/`,
        }),
      })
      return res.ok
    },
    async signOut() {
  await fetch(`${API_BASE}/auth/sign-out`, { method: 'POST', credentials: 'include' })
      window.location.href = '/'
    },
  },
  events: {
    list() { return apiRequest('/events') },
    getInfo(eventId: string) { return apiRequest(`/events/${eventId}/info`) },
    getTickets(eventId: string) { return apiRequest(`/events/${eventId}/tickets`) },
    getStats(eventId: string) { return apiRequest(`/events/${eventId}/stats`) },
  },
  tickets: {
    getFormFields(ticketId: string) { return apiRequest(`/tickets/${ticketId}/form-fields`) },
  },
  registrations: {
    create(data: any) { return apiRequest('/registrations', { method: 'POST', body: JSON.stringify(data) }) },
    getUserRegistrations() { return apiRequest('/registrations') },
    update(id: string, data: any) { return apiRequest(`/registrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }) },
    cancel(id: string) { return apiRequest(`/registrations/${id}`, { method: 'DELETE' }) },
  },
  referrals: {
    getUserCode() { return apiRequest('/referrals') },
    create() { return apiRequest('/referrals', { method: 'POST' }) },
  },
  invitations: {
    // Backend provides verify and info endpoints; prefer these
    verify(code: string, ticketId: string) {
      return apiRequest('/invitation-codes/verify', { method: 'POST', body: JSON.stringify({ code, ticketId }) })
    },
    info(code: string, ticketId: string) {
      const sp = new URLSearchParams({ ticketId })
      return apiRequest(`/invitation-codes/${encodeURIComponent(code)}/info?${sp.toString()}`)
    },
    // Back-compat no-ops for previous API surface (not used by backend routes)
    validate(code: string) { return apiRequest('/invitation-codes/verify', { method: 'POST', body: JSON.stringify({ code, ticketId: '' }) }) },
    use(code: string) { return Promise.resolve({ success: false, message: 'Not implemented' }) as any },
  },
  admin: {
    users: {
      list(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/users?${sp}`) },
      get(userId: string) { return apiRequest(`/admin/users/${userId}`) },
      update(userId: string, data: any) { return apiRequest(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }) },
      delete(userId: string) { return apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }) },
    },
    events: {
      list(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/events?${sp}`) },
      create(data: any) { return apiRequest('/admin/events', { method: 'POST', body: JSON.stringify(data) }) },
      update(eventId: string, data: any) { return apiRequest(`/admin/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }) },
      delete(eventId: string) { return apiRequest(`/admin/events/${eventId}`, { method: 'DELETE' }) },
    },
    tickets: {
      list(eventId: string, params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/tickets?eventId=${eventId}&${sp}`) },
      create(data: any) { return apiRequest('/admin/tickets', { method: 'POST', body: JSON.stringify(data) }) },
      update(ticketId: string, data: any) { return apiRequest(`/admin/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify(data) }) },
      delete(ticketId: string) { return apiRequest(`/admin/tickets/${ticketId}`, { method: 'DELETE' }) },
    },
    registrations: {
      list(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/registrations?${sp}`) },
      get(id: string) { return apiRequest(`/admin/registrations/${id}`) },
      update(id: string, data: any) { return apiRequest(`/admin/registrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }) },
      updateStatus(id: string, status: string) { return apiRequest(`/admin/registrations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }) },
      export(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/registrations/export?${sp}`) },
    },
    invitationCodes: {
      list(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/invitation-codes?${sp}`) },
      create(data: any) { return apiRequest('/admin/invitation-codes', { method: 'POST', body: JSON.stringify(data) }) },
      update(codeId: string, data: any) { return apiRequest(`/admin/invitation-codes/${codeId}`, { method: 'PUT', body: JSON.stringify(data) }) },
      delete(codeId: string) { return apiRequest(`/admin/invitation-codes/${codeId}`, { method: 'DELETE' }) },
      bulkCreate(data: any) { return apiRequest('/admin/invitation-codes/bulk', { method: 'POST', body: JSON.stringify(data) }) },
    },
    analytics: {
      getDashboard(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/analytics/dashboard?${sp}`) },
      getReferralAnalytics(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/analytics/referrals?${sp}`) },
      getTrends(params: Record<string, string> = {}) { const sp = new URLSearchParams(params); return apiRequest(`/admin/analytics/trends?${sp}`) },
    },
  },
}

export type Api = typeof api
