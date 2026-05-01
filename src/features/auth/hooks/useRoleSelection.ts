'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { RoleType } from '../types/role.types'
import { saveRole, getRole } from '../utils/storage'

export const useRoleSelection = () => {
  const router = useRouter()
  const t = useTranslations('auth.validation')
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectRole = useCallback((role: RoleType) => {
    setSelectedRole(role)
    setError(null)
  }, [])

  const navigateToLogin = useCallback((role?: RoleType) => {
    const roleToUse = role || selectedRole
    
    if (!roleToUse) {
      setError(t('roleRequired'))
      return
    }
    
    saveRole(roleToUse)
    router.push(`/auth/login?role=${roleToUse}`)
  }, [selectedRole, router, t])

  const navigateToRegister = useCallback((role?: RoleType) => {
    const roleToUse = role || selectedRole
    
    if (!roleToUse) {
      setError(t('roleRequired'))
      return
    }
    
    saveRole(roleToUse)
    router.push(`/auth/register?role=${roleToUse}`)
  }, [selectedRole, router, t])

  const loadStoredRole = useCallback(() => {
    const storedRole = getRole()
    if (storedRole) {
      setSelectedRole(storedRole)
    }
    return storedRole
  }, [])

  return {
    selectedRole,
    error,
    selectRole,
    navigateToLogin,
    navigateToRegister,
    loadStoredRole,
  }
}
