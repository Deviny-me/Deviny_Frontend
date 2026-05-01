/**
 * Centralised access-token storage helpers.
 *
 * When "Remember Me" is checked the token is written to **localStorage**
 * (persists across browser restarts).  Otherwise it goes into
 * **sessionStorage** (cleared when the browser closes).
 *
 * Every *read* checks both stores so callers don't need to know which
 * one was used at login time.
 */

const TOKEN_KEY = 'accessToken'

/** Return the access token from whichever storage holds it. */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

/** Persist the access token in the correct storage. */
export function setAccessToken(token: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

/** Remove the token from both storages. */
export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
