// Centralized API configuration.
// In development default to local API unless NEXT_PUBLIC_API_URL is explicitly provided.
const DEFAULT_API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : 'https://api.deviny.me';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL;
export const API_URL = `${API_BASE_URL}/api`;
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL;

// Helper to refresh access token
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send HttpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      }, 
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    if (data.accessToken) {
      // Preserve whichever storage the token was originally in
      const wasInLocal = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
      const store = wasInLocal ? localStorage : sessionStorage;
      store.setItem('accessToken', data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Helper to get auth header with auto-refresh
export async function getAuthHeaderAsync(): Promise<Record<string, string>> {
  let token = typeof window !== 'undefined'
    ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
    : null;
  
  // Try to refresh token if not available
  if (!token && typeof window !== 'undefined') {
    token = await refreshAccessToken();
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Synchronous version (for backward compatibility)
export function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
    : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Helper to make authenticated API request with auto token refresh
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeader = await getAuthHeaderAsync();
  
  // Prepare headers - don't add Content-Type if explicitly set to empty or if body is FormData
  const headers: Record<string, string> = { ...authHeader };
  
  if (options.headers) {
    const optionsHeaders = options.headers as Record<string, string>;
    Object.assign(headers, optionsHeaders);
  }
  
  // Only add Content-Type if not already set and body is not FormData
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders: Record<string, string> = { 
        Authorization: `Bearer ${newToken}` 
      };
      
      if (options.headers) {
        const optionsHeaders = options.headers as Record<string, string>;
        Object.assign(retryHeaders, optionsHeaders);
      }
      
      // Only add Content-Type if not already set and body is not FormData
      if (!retryHeaders['Content-Type'] && !(options.body instanceof FormData)) {
        retryHeaders['Content-Type'] = 'application/json';
      }
      
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });
    } else {
      // Redirect to login if refresh failed
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
    }
  }

  return response;
}

// Helper to build full URL
export function buildUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Helper to get full media URL (for avatars, uploads, etc.)
export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Otherwise prepend the direct backend URL (not proxied)
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
