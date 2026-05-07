'use client'

import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    // Preserve query string (e.g. ?lang=ru forwarded from the landing page)
    // and hash across the redirect, so LanguageProvider on the destination
    // route can still read it.
    const search = window.location.search
    const hash = window.location.hash
    const go = (path: string) => window.location.replace(`${path}${search}${hash}`)

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        if (!isExpired) {
          const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          if (role === 'Trainer' || role === '1') {
            go('/trainer')
            return
          } else if (role === 'Nutritionist' || role === '3') {
            go('/nutritionist')
            return
          } else {
            go('/user')
            return
          }
        }
      } catch { /* ignore */ }
    }
    go('/auth')
  }, [])

  return null
}
