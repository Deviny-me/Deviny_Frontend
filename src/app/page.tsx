'use client'

import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        if (!isExpired) {
          const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          if (role === 'Trainer' || role === '1') {
            window.location.replace('/trainer')
            return
          } else if (role === 'Nutritionist' || role === '3') {
            window.location.replace('/nutritionist')
            return
          } else {
            window.location.replace('/user')
            return
          }
        }
      } catch { /* ignore */ }
    }
    window.location.replace('/auth')
  }, [])

  return null
}
