'use client'

import { useState, useEffect } from 'react'
import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { userScheduleApi } from '@/lib/api/userScheduleApi'

function getUserIdFromToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (
      payload.sub ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      null
    )
  } catch {
    return null
  }
}

export default function SchedulePage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getUserIdFromToken())
  }, [])

  return <ScheduleContent api={userScheduleApi} currentUserId={userId ?? undefined} />
}
