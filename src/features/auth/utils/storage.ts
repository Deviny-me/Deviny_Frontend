import { RoleType } from '../types/role.types'
import { STORAGE_KEY } from '../constants/roles'

export const saveRole = (role: RoleType): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, role)
  }
}

export const getRole = (): RoleType | null => {
  if (typeof window !== 'undefined') {
    const role = localStorage.getItem(STORAGE_KEY)
    return role as RoleType | null
  }
  return null
}

export const clearRole = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const storage = {
  saveRole,
  getRole,
  clearRole,
}
