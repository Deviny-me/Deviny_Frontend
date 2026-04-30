'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserProvider } from '@/components/user/UserProvider'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { UnreadNotificationsProvider } from '@/contexts/UnreadNotificationsContext'
import { LevelProvider } from '@/components/level/LevelProvider'
import { UserAchievementBridge } from '@/components/user/UserAchievementBridge'
import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { RealtimeToastContainer } from '@/components/shared/RealtimeToast'
import { Spinner } from '@/components/ui/Spinner'

// Routes where right sidebar should be hidden
const HIDE_RIGHT_SIDEBAR = [
  '/user/challenges', '/user/settings', '/user/schedule',
  '/user/leaderboards', '/user/live', '/user/experts', '/user/discovery',
  '/user/achievements', '/user/messages', '/user/notifications',
]
// Routes where both sidebars should be hidden
const HIDE_ALL_SIDEBARS: string[] = []

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const checkedRef = useRef(false)

  const showLeftSidebar = !HIDE_ALL_SIDEBARS.some(r => pathname?.startsWith(r))
  const showRightSidebar = !HIDE_RIGHT_SIDEBAR.some(r => pathname?.startsWith(r)) && showLeftSidebar

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login?role=user')
      return
    }

    // Decode JWT to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      
      if (role !== 'User' && role !== '0') {
        router.push('/auth/login?role=user')
        return
      }
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token decode error:', error)
      router.push('/auth/login?role=user')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" color="user" />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <UnreadMessagesProvider>
            <UnreadNotificationsProvider>
              <LevelProvider>
                <UserAchievementBridge>
                  <RealtimeToastContainer />
                  <UserMainLayout showLeftSidebar={showLeftSidebar} showRightSidebar={showRightSidebar}>
                    {children}
                  </UserMainLayout>
                </UserAchievementBridge>
              </LevelProvider>
            </UnreadNotificationsProvider>
          </UnreadMessagesProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
