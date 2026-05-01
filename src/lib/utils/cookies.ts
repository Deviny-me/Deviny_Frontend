/**
 * Cookie utility functions for client-side cookie management
 */

export interface CookieOptions {
  expires?: number // days
  path?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

const DEFAULT_OPTIONS: CookieOptions = {
  expires: 365,
  path: '/',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  sameSite: 'lax',
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return

  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  
  if (opts.expires) {
    const date = new Date()
    date.setTime(date.getTime() + opts.expires * 24 * 60 * 60 * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  }
  
  if (opts.path) {
    cookieString += `; path=${opts.path}`
  }
  
  if (opts.secure) {
    cookieString += '; secure'
  }
  
  if (opts.sameSite) {
    cookieString += `; samesite=${opts.sameSite}`
  }
  
  document.cookie = cookieString
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const nameEQ = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(';')
  
  for (const cookie of cookies) {
    let c = cookie.trim()
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length))
    }
  }
  
  return null
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
}

// Remember Me cookie constants
export const REMEMBER_ME_COOKIE = 'deviny_remember_me'
export const REMEMBERED_EMAIL_COOKIE = 'deviny_remembered_email'
export const REMEMBERED_ROLE_COOKIE = 'deviny_remembered_role'

/**
 * Save remember me preferences to cookies
 */
export function saveRememberMePreferences(email: string, role: string): void {
  setCookie(REMEMBER_ME_COOKIE, 'true', { expires: 30 })
  setCookie(REMEMBERED_EMAIL_COOKIE, email, { expires: 30 })
  setCookie(REMEMBERED_ROLE_COOKIE, role, { expires: 30 })
}

/**
 * Clear remember me preferences from cookies
 */
export function clearRememberMePreferences(): void {
  removeCookie(REMEMBER_ME_COOKIE)
  removeCookie(REMEMBERED_EMAIL_COOKIE)
  removeCookie(REMEMBERED_ROLE_COOKIE)
}

/**
 * Get remember me preferences from cookies
 */
export function getRememberMePreferences(): { rememberMe: boolean; email: string; role: string | null } {
  const rememberMe = getCookie(REMEMBER_ME_COOKIE) === 'true'
  const email = getCookie(REMEMBERED_EMAIL_COOKIE) || ''
  const role = getCookie(REMEMBERED_ROLE_COOKIE)
  
  return { rememberMe, email, role }
}
