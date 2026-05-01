import { authService } from '@/features/auth/services/authService'
import { getAccessToken, setAccessToken, clearAccessToken } from '@/features/auth/utils/tokenStorage'
import { API_URL } from '@/lib/config'

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const result = await authService.refreshToken()
        if (result) {
          // Preserve whichever storage the token was originally in
          const wasInLocal = !!localStorage.getItem('accessToken')
          setAccessToken(result.accessToken, wasInLocal)
          return true
        }
        return false
      } catch {
        return false
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async fetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options

    const makeRequest = async (token?: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string>),
      }

      if (!skipAuth && token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      return fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      })
    }

    let token = getAccessToken()
    let response = await makeRequest(token)

    // If unauthorized, try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshTokenIfNeeded()
      if (refreshed) {
        token = getAccessToken()
        response = await makeRequest(token)
      } else {
        // Redirect to login if refresh failed
        clearAccessToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        throw new Error('Session expired')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || 'Request failed')
    }

    // Handle empty responses
    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async postFormData<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const { headers, ...rest } = options
    return this.fetch<T>(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
    })
  }
}

export const apiClient = new ApiClient()
