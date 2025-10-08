// Authentication utilities for frontend
const BACKEND_URI = import.meta.env.BACKEND_URI || 'http://localhost:3000';

/**
 * Get current session from backend
 */
export async function getSession() {
  try {
    const response = await fetch(`${BACKEND_URI}/api/auth/get-session`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const response = await fetch(`${BACKEND_URI}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (response.ok) {
      // Redirect to home or login page
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
}

/**
 * Send magic link to email
 */
export async function sendMagicLink(email) {
  try {
    const response = await fetch(`${BACKEND_URI}/api/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        callbackURL: `${window.location.origin}/`,
        newUserCallbackURL: `${window.location.origin}/`,
        errorCallbackURL: `${window.location.origin}/login/`
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send magic link:', error);
    return false;
  }
}

/**
 * Make authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BACKEND_URI}/api${endpoint}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}