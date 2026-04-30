import { RoleType } from '@/features/auth/types/role.types'
import { API_URL } from '@/lib/config'
import { clearRememberMePreferences } from '@/lib/utils/cookies'

export interface LoginRequestDto {
  email: string
  password: string
  role: RoleType
  rememberMe: boolean
}

export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string | number
  country?: string
  city?: string
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserDto
}

export interface RefreshResponseDto {
  accessToken: string
  user: UserDto
}

export interface RegisterRequestDto {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleType
  // Extended fields for trainer registration
  phone?: string
  gender?: 'Male' | 'Female' | 'Other'
  country?: string
  city?: string
  hasInjuries?: boolean
  verificationDocument?: File
  injuryDocument?: File
}

export interface SendOtpResponseDto {
  message: string
  expiresInMinutes: number
}

export interface VerifyOtpResponseDto {
  message: string
  verified: boolean
}

function getAppLanguage(): 'ru' | 'en' | 'az' {
  if (typeof window === 'undefined') return 'ru'
  const stored = localStorage.getItem('deviny.language')
  if (stored === 'en' || stored === 'az' || stored === 'ru') return stored
  return 'ru'
}

export const authService = {
  async sendOtp(email: string): Promise<SendOtpResponseDto> {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': getAppLanguage(),
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      let message = 'Failed to send OTP'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async verifyOtp(email: string, otpCode: string): Promise<VerifyOtpResponseDto> {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otpCode }),
    })

    if (!response.ok) {
      let message = 'Verification failed'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async forgotPassword(email: string): Promise<{ message: string; expiresInMinutes?: number }> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': getAppLanguage(),
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      let message = 'Failed to send reset code'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async verifyResetOtp(email: string, otpCode: string): Promise<{ message: string; verified: boolean }> {
    const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otpCode }),
    })

    if (!response.ok) {
      let message = 'Verification failed'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otpCode, newPassword }),
    })

    if (!response.ok) {
      let message = 'Password reset failed'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        // Backend UserRole enum: User=0, Trainer=1, Student=2, Nutritionist=3
        role: data.role === 'user' ? 0 : data.role === 'trainer' ? 1 : 3, // nutritionist=3
        rememberMe: data.rememberMe,
      }),
    })

    if (!response.ok) {
      let message = 'Login failed'
      try {
        const error = await response.json()
        message = error.message || message
      } catch {
        // Backend returned non-JSON (e.g. server is down)
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async register(data: RegisterRequestDto): Promise<LoginResponseDto> {
    const formData = new FormData()
    formData.append('firstName', data.firstName)
    formData.append('lastName', data.lastName)
    formData.append('email', data.email)
    formData.append('password', data.password)
    // Backend UserRole enum: User=0, Trainer=1, Student=2, Nutritionist=3
    formData.append('role', data.role === 'user' ? '0' : data.role === 'trainer' ? '1' : '3') // nutritionist=3
    
    // Extended fields for trainers
    if (data.phone) {
      formData.append('phone', data.phone)
    }
    if (data.gender) {
      formData.append('gender', data.gender)
    }
    if (data.country) {
      formData.append('country', data.country)
    }
    if (data.city) {
      formData.append('city', data.city)
    }
    formData.append('hasInjuries', data.hasInjuries ? 'true' : 'false')
    if (data.verificationDocument) {
      formData.append('verificationDocument', data.verificationDocument)
    }
    if (data.injuryDocument) {
      formData.append('injuryDocument', data.injuryDocument)
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      let message = 'Registration failed'
      try {
        const error = await response.json()
        if (response.status === 409) {
          throw new Error('EMAIL_ALREADY_REGISTERED')
        }
        message = error.message || message
      } catch (e) {
        if (e instanceof Error && e.message === 'EMAIL_ALREADY_REGISTERED') throw e
        message = 'SERVER_UNAVAILABLE'
      }
      throw new Error(message)
    }

    return response.json()
  },

  async refreshToken(): Promise<RefreshResponseDto | null> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
    // Clear remember me cookies on logout
    clearRememberMePreferences()
  },
}
