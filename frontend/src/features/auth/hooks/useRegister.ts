'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { authService } from '@/features/auth/services/authService'
import { useAuth } from '@/features/auth/AuthContext'
import { RoleType } from '@/features/auth/types/role.types'

export type GenderType = 'Male' | 'Female' | 'Other'

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  // Extended fields for trainer registration
  phone?: string
  gender?: GenderType
  country?: string
  city?: string
  hasInjuries: boolean
  verificationDocument?: File
  injuryDocument?: File
}

interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  termsAccepted?: string
  phone?: string
  gender?: string
  country?: string
  city?: string
  verificationDocument?: string
  injuryDocument?: string
  general?: string
}

export const useRegister = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const { setAuthUser } = useAuth()
  const t = useTranslations('auth.validation')

  const validateForm = (data: RegisterFormData, role: RoleType): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate first name
    if (!data.firstName.trim()) {
      newErrors.firstName = t('firstNameRequired')
    } else if (data.firstName.trim().length < 2) {
      newErrors.firstName = t('firstNameMin')
    }

    // Validate last name
    if (!data.lastName.trim()) {
      newErrors.lastName = t('lastNameRequired')
    } else if (data.lastName.trim().length < 2) {
      newErrors.lastName = t('lastNameMin')
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email) {
      newErrors.email = t('emailRequired')
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = t('emailFormat')
    }

    // Validate password
    if (!data.password) {
      newErrors.password = t('passwordRequired')
    } else if (data.password.length < 6) {
      newErrors.password = t('passwordMin')
    } else if (!/\d/.test(data.password)) {
      newErrors.password = t('passwordDigit')
    }

    // Validate confirm password
    if (!data.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired')
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = t('passwordsMismatch')
    }

    // Validate terms acceptance
    if (!data.termsAccepted) {
      newErrors.termsAccepted = t('termsRequired')
    }

    // Additional validation for trainers and nutritionists
    if (role === 'trainer' || role === 'nutritionist') {
      if (!data.phone?.trim()) {
        newErrors.phone = t('phoneRequired')
      } else {
        // Basic phone validation (digits, spaces, +, -, parentheses)
        const phoneRegex = /^[\d\s\+\-\(\)]+$/
        if (!phoneRegex.test(data.phone)) {
          newErrors.phone = t('phoneInvalid')
        } else if (data.phone.replace(/\D/g, '').length < 10) {
          newErrors.phone = t('phoneMin')
        }
      }
      if (!data.gender) {
        newErrors.gender = t('genderRequired')
      }
      if (!data.country) {
        newErrors.country = t('countryRequired')
      }
      if (!data.city?.trim()) {
        newErrors.city = t('cityRequired')
      }
      if (!data.verificationDocument) {
        newErrors.verificationDocument = t('documentRequired')
      } else {
        // Validate file size (10 MB max)
        if (data.verificationDocument.size > 10 * 1024 * 1024) {
          newErrors.verificationDocument = t('documentSize')
        }
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(data.verificationDocument.type)) {
          newErrors.verificationDocument = t('documentFormat')
        }
      }
    }

    if (data.hasInjuries) {
      if (!data.injuryDocument) {
        newErrors.injuryDocument = t('injuryDocumentRequired')
      } else {
        if (data.injuryDocument.size > 10 * 1024 * 1024) {
          newErrors.injuryDocument = t('documentSize')
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(data.injuryDocument.type)) {
          newErrors.injuryDocument = t('documentFormat')
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const register = async (data: RegisterFormData, role: RoleType) => {
    // Clear previous errors
    setErrors({})

    // Validate form
    if (!validateForm(data, role)) {
      return
    }

    setLoading(true)

    try {
      const response = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role,
        phone: data.phone,
        gender: data.gender,
        country: data.country,
        city: data.city,
        hasInjuries: data.hasInjuries,
        verificationDocument: data.verificationDocument,
        injuryDocument: data.injuryDocument,
      })

      // Store auth data (registration defaults to session-only)
      sessionStorage.setItem('accessToken', response.accessToken)

      // Map user and update AuthContext so role-based colors work immediately
      const roleStr = String(response.user.role).toLowerCase()
      const normalizedRole: 'user' | 'trainer' | 'nutritionist' =
        roleStr === 'trainer' || roleStr === '1' ? 'trainer'
        : roleStr === 'nutritionist' || roleStr === '3' ? 'nutritionist'
        : 'user'
      setAuthUser({
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        role: normalizedRole,
      }, 'session')

      // Navigate to role-specific dashboard
      const dashboardRoute = role === 'user' ? '/user' : role === 'nutritionist' ? '/nutritionist' : '/trainer'
      router.push(dashboardRoute)
      // Don't setLoading(false) on success — let it stay true
      // until the page navigates away (component unmounts)
    } catch (error) {
      if (error instanceof Error) {
        const errorMap: Record<string, string> = {
          'EMAIL_ALREADY_REGISTERED': t('emailAlreadyRegistered'),
          'SERVER_UNAVAILABLE': t('serverUnavailable'),
        }
        setErrors({ general: errorMap[error.message] || error.message })
      } else {
        setErrors({ general: t('registrationError') })
      }
      setLoading(false)
    }
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    loading,
    errors,
    register,
    clearErrors,
  }
}
