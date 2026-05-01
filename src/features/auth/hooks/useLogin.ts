'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { LoginRequestDto } from '../services/authService'
import { useAuth } from '../AuthContext'

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login: authLogin } = useAuth()
  const t = useTranslations('auth.validation')

  const login = async (data: LoginRequestDto) => {
    setIsLoading(true)
    setError(null)

    try {
      // Delegate to AuthContext.login — it calls the API, updates user state,
      // and persists both token + user to the correct storage.
      await authLogin(
        data.email,
        data.password,
        (data.role as 'user' | 'trainer' | 'nutritionist') || 'trainer',
        data.rememberMe ?? false,
      )
      // Don't setIsLoading(false) on success — let it stay true
      // until the page navigates away (component unmounts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      const errorMap: Record<string, string> = {
        'SERVER_UNAVAILABLE': t('serverUnavailable'),
      }
      setError(errorMap[message] || message)
      setIsLoading(false)
      throw err
    }
  }

  return { login, isLoading, error, setError }
}
