'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useUser } from '@/components/user/UserProvider'
import { LevelBadge } from '@/components/ui/LevelBadge'
import { useTranslations } from 'next-intl'

export function UserDashboardHeader() {
  const router = useRouter()
  const { user, logout } = useUser()
  const t = useTranslations('userDashboard')

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login?role=user')
  }

  // Получаем инициалы из имени
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Brand */}
          <div>
            <h1 className="page-title-compact text-[#0c8de6] dark:text-[#0c8de6]">CoachOS</h1>
          </div>

          {/* Right - Profile & Level */}
          <div className="flex items-center gap-4">
            {/* Level Badge - Compact */}
            <LevelBadge showTitle={false} className="scale-75" />
            
            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-foreground font-semibold">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-gray-900 dark:text-neutral-50 text-sm">{user?.name || t('user')}</p>
                <p className="text-xs text-faint-foreground dark:text-neutral-400">{t('student')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
