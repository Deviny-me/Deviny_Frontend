'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NavSection } from './types'
import { startNavigation } from '@/components/ui/RouteProgressBar'
import { useAchievementsOptional } from '@/contexts/AchievementsContext'

interface SharedLeftSidebarProps {
  sections: NavSection[]
  className?: string
  accentColor?: 'orange' | 'green' | 'blue'
}

const colorMap = {
  green:  { activeBg: 'from-[#28bf68]/10 to-[#1c9e52]/10', activeBorder: 'border-[#28bf68]', activeIcon: 'text-[#28bf68]', hoverIcon: 'group-hover:text-[#28bf68]', badge: 'bg-[#1c9e52]' },
  orange: { activeBg: 'from-[#f07915]/10 to-[#d4600b]/10', activeBorder: 'border-[#f07915]', activeIcon: 'text-[#f07915]', hoverIcon: 'group-hover:text-[#f07915]', badge: 'bg-[#d4600b]' },
  blue:   { activeBg: 'from-[#0c8de6]/10 to-[#0070c4]/10', activeBorder: 'border-[#0c8de6]', activeIcon: 'text-[#0c8de6]', hoverIcon: 'group-hover:text-[#0c8de6]', badge: 'bg-[#0070c4]' },
}

/**
 * Shared left sidebar navigation component.
 * Configurable via sections prop for different user roles.
 */
export function SharedLeftSidebar({ sections, className, accentColor = 'orange' }: SharedLeftSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const achievements = useAchievementsOptional()

  const isActivePath = (path: string) =>
    pathname === path || (path.split('/').length > 2 && pathname?.startsWith(`${path}/`))

  const colors = colorMap[accentColor]

  return (
    <div className={`hidden sm:block w-16 sm:w-44 md:w-52 lg:w-60 flex-shrink-0 space-y-1 sm:space-y-2 sticky top-[49px] md:top-[57px] h-[calc(100vh-49px)] md:h-[calc(100vh-57px)] overflow-y-auto pb-2 sm:pb-4 md:pb-6 scrollbar-hide ${className || ''}`}>
      {/* Navigation Links */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle overflow-hidden">
        <div className="p-0.5 sm:p-1 sm:pb-1.5 md:p-1.5">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-2 sm:px-3 pt-2 sm:pt-4 pb-1 sm:pb-2">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-faint-foreground uppercase tracking-widest">
                    {t(section.title as any)}
                  </p>
                </div>
              )}
              {section.links.map((link, linkIndex) => {
                const isActive = isActivePath(link.path)
                const LinkIcon = link.icon
                const dynamicBadge =
                  link.label === 'achievements' && achievements
                    ? achievements.unlockedCount
                    : link.badge
                return (
                  <button
                    key={`${link.path}-${linkIndex}`}
                    onClick={() => { if (!isActivePath(link.path)) startNavigation(); router.push(link.path) }}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? `bg-gradient-to-r ${colors.activeBg} border-l-2 ${colors.activeBorder}`
                        : 'text-muted-foreground hover:bg-hover-overlay hover:text-foreground'
                    }`}
                  >
                    <LinkIcon 
                      className={`w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] transition-colors ${
                        isActive 
                          ? colors.activeIcon 
                          : `text-faint-foreground ${colors.hoverIcon}`
                      }`} 
                      strokeWidth={isActive ? 2 : 1.5} 
                    />
                    <span className={`text-[11px] sm:text-[13px] font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {t(link.label as any)}
                    </span>
                    {dynamicBadge !== undefined && dynamicBadge > 0 && (
                      <span className={`ml-auto px-1 py-0.5 text-[9px] sm:text-[10px] font-bold ${colors.badge} text-foreground rounded-full min-w-[16px] sm:min-w-[20px] text-center`}>
                        {dynamicBadge}
                      </span>
                    )}
                  </button>
                )
              })}
              {sectionIndex < sections.length - 1 && section.title !== null && (
                <div className="px-3 py-2.5">
                  <div className="h-px bg-border-subtle"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
