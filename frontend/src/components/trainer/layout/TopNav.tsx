'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { startNavigation } from '@/components/ui/RouteProgressBar'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  User,
  Users,
  Sun,
  Moon
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchTrainerProfile } from '@/lib/api/trainerProfileApi'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext'
import { useLevel } from '@/components/level/LevelProvider'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { useTheme } from '@/components/theme/ThemeProvider'

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useTranslations('nav')
  const tSearch = useTranslations('search')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfileResponse | null>(null)
  const { unreadCount } = useUnreadMessages()
  const { level } = useLevel()
  const { theme, toggleTheme } = useTheme()

  const roleLabel = t('trainer')
  const avatarFallbackInitial = 'T'

  useEffect(() => {
    loadTrainerProfile()
    
    // Listen for avatar update events
    const handleAvatarUpdate = () => {
      loadTrainerProfile()
    }
    
    window.addEventListener('trainerAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('trainerAvatarUpdated', handleAvatarUpdate)
  }, [])

  const loadTrainerProfile = async () => {
    try {
      const data = await fetchTrainerProfile()
      setTrainerProfile(data)
    } catch (error) {
      console.error('Failed to load trainer profile:', error)
    }
  }

  useRealtimeScopeRefresh(['profile'], () => {
    loadTrainerProfile()
  })

  const navItems = [
    { icon: Users, label: t('friends'), path: '/trainer/friends', badge: undefined },
    { icon: MessageCircle, label: t('messages'), path: '/trainer/messages', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User, label: t('profile'), path: '/trainer/profile', badge: undefined },
    { icon: Settings, label: t('settings'), path: '/trainer/settings', badge: undefined },
  ]

  // Debug logging
  useEffect(() => {
    console.log('[TopNav] unreadCount updated:', unreadCount)
  }, [unreadCount])

  useEffect(() => {
    if (!showProfileMenu) return

    const handlePointerDown = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showProfileMenu])

  const isActive = (path: string) => pathname === path || (path.split('/').length > 2 && pathname?.startsWith(`${path}/`))

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <nav className="sticky top-0 glass-strong border-b border-border-subtle z-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-y-2 py-2 md:h-14 md:flex-nowrap md:justify-between md:py-0">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 md:max-w-xl">
            {/* Logo */}
            <button 
              onClick={() => { if (pathname !== '/trainer') startNavigation(); router.push('/trainer') }}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image src={theme === 'dark' ? '/logo-white.png' : '/logo.png'} alt="Deviny" width={90} height={30} className="h-7 w-auto" />
            </button>
            <div className="hidden md:block flex-1 min-w-0">
              <SearchBar placeholder={tSearch('trainerPlaceholder')} />
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              return (
                <button
                  key={item.path}
                  onClick={() => { if (!isActive(item.path)) startNavigation(); router.push(item.path) }}
                  className={`relative flex flex-col items-center justify-center px-5 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'text-[#f07915] bg-[#f07915]/[0.12] dark:bg-[#f07915]/[0.08]'
                      : hasUnread
                      ? 'text-[#d4600b] hover:text-[#d4600b]'
                      : 'text-faint-foreground hover:text-muted-foreground hover:bg-hover-overlay'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="mt-0.5 text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#f07915] rounded-full" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] bg-[#f07915] rounded-full flex items-center justify-center px-1">
                      <span className="text-[10px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-none justify-end md:flex-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-hover-overlay text-muted-foreground hover:text-foreground transition-all"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <SearchBar mobileModal placeholder={tSearch('trainerPlaceholder')} />
            <LanguageSwitcher compact />
            <div className="hidden sm:block w-px h-5 bg-border-subtle" />
            {/* Notifications */}
            <NotificationDropdown />

            <div className="hidden sm:block w-px h-5 bg-border-subtle" />

            {/* Profile Menu */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-hover-overlay transition-all"
              >
                {trainerProfile?.trainer?.avatarUrl ? (
                  <img
                    src={getMediaUrl(trainerProfile.trainer.avatarUrl) || ''}
                    alt={trainerProfile.trainer.fullName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#f07915]/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f07915] to-[#d4600b] flex items-center justify-center ring-2 ring-[#f07915]/30">
                    <span className="text-white text-sm font-bold">
                      {trainerProfile?.trainer?.initials || avatarFallbackInitial}
                    </span>
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-foreground leading-tight">{t('me')}</p>
                  <svg className={`w-3 h-3 text-muted-foreground mx-auto mt-0.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" />
                  <div className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-surface-2 border border-border rounded-xl overflow-hidden z-50 animate-slide-down" style={{ boxShadow: 'var(--dropdown-shadow)' }}>
                    <div className="p-4 border-b border-border-subtle">
                      <div className="flex items-center gap-3">
                        {trainerProfile?.trainer?.avatarUrl ? (
                          <img
                            src={getMediaUrl(trainerProfile.trainer.avatarUrl) || ''}
                            alt={trainerProfile.trainer.fullName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#f07915]/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f07915] to-[#d4600b] flex items-center justify-center ring-2 ring-[#f07915]/30">
                            <span className="text-white text-lg font-bold">
                              {trainerProfile?.trainer?.initials || avatarFallbackInitial}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{trainerProfile?.trainer?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
                          <p className="text-xs text-faint-foreground">{roleLabel}</p>
                        </div>
                      </div>
                      {/* Level Display */}
                      {level && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-[#f07915]/[0.1] to-[#d4600b]/[0.1] dark:from-[#f07915]/[0.06] dark:to-[#d4600b]/[0.06] border border-[#f07915]/15 dark:border-[#f07915]/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">Level {level.currentLevel}</span>
                            <span className="text-[11px] text-faint-foreground">{level.currentXp} / {level.requiredXpForNextLevel} XP</span>
                          </div>
                          <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#f07915] to-[#d4600b] rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${(level.currentXp / level.requiredXpForNextLevel) * 100}%` }}
                            />
                          </div>
                          {level.levelTitle && (
                            <p className="text-[10px] text-[#f07915]/80 font-medium mt-1.5">{level.levelTitle}</p>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          router.push('/trainer/profile')
                          setShowProfileMenu(false)
                        }}
                        className="mt-3 w-full py-2 border border-[#f07915]/30 text-[#f07915] rounded-lg text-sm font-medium hover:bg-[#f07915]/10 hover:border-[#f07915]/50 transition-all"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          router.push('/trainer/settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-hover-overlay hover:text-foreground transition-all"
                      >
                        <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        <span className="text-sm">{t('settingsPrivacy')}</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-red-500/[0.08] hover:text-red-400 transition-all"
                      >
                        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        <span className="text-sm">{t('signOut')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
