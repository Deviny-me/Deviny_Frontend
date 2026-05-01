'use client'

import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ReactNode } from 'react'
import { startNavigation } from '@/components/ui/RouteProgressBar'
import { TopNavItem, UserRole } from './types'
import { SearchBar } from '@/components/search/SearchBar'
import { useTheme } from '@/components/theme/ThemeProvider'

const topNavColorMap = {
  green:  { logoBg: 'from-[#28bf68] to-[#1c9e52]', activeText: 'text-[#28bf68]', unreadText: 'text-[#1c9e52] hover:text-[#1c9e52]', indicator: 'bg-[#28bf68]', badge: 'bg-[#1c9e52]' },
  orange: { logoBg: 'from-[#f07915] to-[#d4600b]', activeText: 'text-[#f07915]', unreadText: 'text-[#d4600b] hover:text-[#d4600b]', indicator: 'bg-[#f07915]', badge: 'bg-[#d4600b]' },
  blue:   { logoBg: 'from-[#0c8de6] to-[#0070c4]', activeText: 'text-[#0c8de6]', unreadText: 'text-[#0070c4] hover:text-[#0070c4]', indicator: 'bg-[#0c8de6]', badge: 'bg-[#0070c4]' },
}

interface SharedTopNavProps {
  role: UserRole
  basePath: string
  logoText?: string
  searchPlaceholder: string
  navItems: TopNavItem[]
  unreadCount?: number
  profileSection: ReactNode
  accentColor?: 'orange' | 'green' | 'blue'
  className?: string
}

/**
 * Shared top navigation component.
 * Configurable via props for different user roles.
 */
export function SharedTopNav({
  role,
  basePath,
  logoText,
  searchPlaceholder,
  navItems,
  unreadCount = 0,
  profileSection,
  accentColor = 'orange',
  className,
}: SharedTopNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const tc = topNavColorMap[accentColor]

  const isActive = (path: string) => pathname === path

  // Update nav items with unread count for messages
  const itemsWithBadges = navItems.map(item => ({
    ...item,
    badge: item.path.includes('/messages') && unreadCount > 0 ? unreadCount : item.badge
  }))

  return (
    <nav className={`sticky top-0 glass-strong border-b border-border-subtle z-50 ${className || ''}`}>
      <div className="max-w-full md:max-w-[1280px] mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-between h-11 sm:h-12 md:h-14">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-full sm:max-w-xl">
            {/* Logo */}
            <button 
              onClick={() => { if (pathname !== basePath) startNavigation(); router.push(basePath) }}
              className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image src={theme === 'dark' ? '/logo-white.png' : '/logo.png'} alt="Deviny" width={70} height={24} className="h-5 sm:h-7 w-auto" />
              {logoText && (
                <span className="text-xs sm:text-sm font-bold text-foreground hidden sm:block tracking-tight">{logoText}</span>
              )}
            </button>

            {/* Search */}
            <SearchBar placeholder={searchPlaceholder} />
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-1">
            {itemsWithBadges.map((item) => {
              const hasUnread = item.badge !== undefined && item.badge > 0
              const ItemIcon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => { if (!isActive(item.path)) startNavigation(); router.push(item.path) }}
                  className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? `${tc.activeText} bg-border-subtle`
                      : hasUnread
                      ? tc.unreadText
                      : 'text-faint-foreground hover:text-muted-foreground hover:bg-hover-overlay'
                  }`}
                  title={item.label}
                >
                  <ItemIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  <span className="text-[9px] sm:text-[10px] font-medium mt-0.5 hidden md:block lg:block">{item.label}</span>
                  {isActive(item.path) && (
                    <div className={`absolute bottom-0 left-2 right-2 h-0.5 ${tc.indicator} rounded-full`} />
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className={`absolute -top-0.5 right-1.5 min-w-[18px] h-[18px] ${tc.badge} rounded-full flex items-center justify-center px-1`}>
                      <span className="text-[10px] font-bold text-foreground">{item.badge}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Profile Section (passed as render prop) */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {profileSection}
          </div>
        </div>
      </div>
    </nav>
  )
}
