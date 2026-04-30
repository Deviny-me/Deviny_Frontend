'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UnreadMessagesProvider } from '@/contexts/UnreadMessagesContext'
import { UnreadNotificationsProvider } from '@/contexts/UnreadNotificationsContext'
import { UserProvider } from '@/components/user/UserProvider'
import { TrainerAchievementBridge } from '@/components/trainer/TrainerAchievementBridge'
import { LevelProvider } from '@/components/level/LevelProvider'
import { MainLayout } from '@/components/trainer/layout/MainLayout'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { RealtimeToastContainer } from '@/components/shared/RealtimeToast'
import { Spinner } from '@/components/ui/Spinner'

// Routes where right sidebar should be hidden
const HIDE_RIGHT_SIDEBAR = [
  '/trainer/profile', '/trainer/students', '/trainer/settings',
  '/trainer/messages', '/trainer/leaderboards', '/trainer/live',
  '/trainer/discovery', '/trainer/challenges', '/trainer/achievements',
  '/trainer/experts', '/trainer/dashboard', '/trainer/notifications',
]
// Routes where both sidebars should be hidden
const HIDE_ALL_SIDEBARS: string[] = []

export default function TrainerDashboardLayout({
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
      router.push('/auth/login?role=trainer')
      return
    }

    // Decode JWT to check role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      
      // Only allow Trainers to access this dashboard
      const allowedRoles = ['Trainer', '1']
      if (!allowedRoles.includes(role)) {
        router.push('/auth/login?role=trainer')
        return
      }
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token decode error:', error)
      router.push('/auth/login?role=trainer')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" color="trainer" />
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
                <TrainerAchievementBridge>
                  <RealtimeToastContainer />
                  <MainLayout showLeftSidebar={showLeftSidebar} showRightSidebar={showRightSidebar}>
                    {children}
                  </MainLayout>
                </TrainerAchievementBridge>
              </LevelProvider>
            </UnreadNotificationsProvider>
          </UnreadMessagesProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
