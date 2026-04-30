'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { startNavigation } from '@/components/ui/RouteProgressBar'
import { NavLink, NavSection } from './types'

interface SharedMobileNavProps {
  primaryLinks: NavLink[]
  sections: NavSection[]
  secondaryLinks: NavLink[]
  accentColor?: 'orange' | 'green' | 'blue'
}

const colorMap = {
  green: {
    activeText: 'text-[#28bf68]',
    activeBg: 'bg-[#28bf68]/12',
    activeBorder: 'border-[#28bf68]/20',
    badge: 'bg-[#1c9e52]',
    ring: 'ring-[#28bf68]/15',
  },
  orange: {
    activeText: 'text-[#f07915]',
    activeBg: 'bg-[#f07915]/12',
    activeBorder: 'border-[#f07915]/20',
    badge: 'bg-[#d4600b]',
    ring: 'ring-[#f07915]/15',
  },
  blue: {
    activeText: 'text-[#0c8de6]',
    activeBg: 'bg-[#0c8de6]/12',
    activeBorder: 'border-[#0c8de6]/20',
    badge: 'bg-[#0070c4]',
    ring: 'ring-[#0c8de6]/15',
  },
}

export function SharedMobileNav({
  primaryLinks,
  sections,
  secondaryLinks,
  accentColor = 'orange',
}: SharedMobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [isOpen, setIsOpen] = useState(false)
  const colors = colorMap[accentColor]

  const menuLinks = useMemo(
    () => [...sections.flatMap((section) => section.links), ...secondaryLinks],
    [sections, secondaryLinks]
  )

  const isActive = (path: string) =>
    pathname === path || (path.split('/').length > 2 && pathname?.startsWith(`${path}/`))

  const navigate = (path: string) => {
    setIsOpen(false)
    if (!isActive(path)) {
      startNavigation()
    }
    router.push(path)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-md rounded-[28px] border border-border-subtle bg-[var(--glass-strong-bg)]/96 p-1.5 shadow-[0_-12px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-1">
          {primaryLinks.map((link) => {
            const LinkIcon = link.icon
            const active = isActive(link.path)
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[20px] border px-2 py-2 text-center transition-all ${
                  active
                    ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                <LinkIcon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{t(link.label as any)}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className={`absolute right-2 top-1.5 min-w-[18px] rounded-full px-1 text-[10px] font-bold text-white ${colors.badge}`}>
                    {link.badge}
                  </span>
                )}
              </button>
            )
          })}

          <button
            onClick={() => setIsOpen(true)}
            className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[20px] border border-transparent px-2 py-2 text-muted-foreground transition-all"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span className="text-[10px] font-medium leading-none">{t('more' as any)}</span>
          </button>
        </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute inset-0 overflow-y-auto border-border-subtle bg-surface-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('menu' as any)}</p>
                <p className="text-xs text-muted-foreground">{t('discover' as any)} / {t('profile' as any)} / {t('settings' as any)}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  {section.title && (
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint-foreground">
                      {t(section.title as any)}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {section.links.map((link) => {
                      const LinkIcon = link.icon
                      const active = isActive(link.path)
                      return (
                        <button
                          key={link.path}
                          onClick={() => navigate(link.path)}
                          className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all ${
                            active
                              ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                              : 'border-transparent text-muted-foreground hover:bg-hover-overlay'
                          }`}
                        >
                          <LinkIcon className="h-5 w-5 shrink-0" strokeWidth={active ? 2 : 1.8} />
                          <span className={`flex-1 text-sm font-medium ${active ? 'text-foreground' : ''}`}>
                            {t(link.label as any)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="space-y-2 border-t border-border-subtle pt-4">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint-foreground">
                  {t('settings' as any)}
                </p>
                <div className="space-y-1.5">
                  {secondaryLinks.map((link) => {
                    const LinkIcon = link.icon
                    const active = isActive(link.path)
                    return (
                      <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all ${
                          active
                            ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                            : 'border-transparent text-muted-foreground hover:bg-hover-overlay'
                        }`}
                      >
                        <LinkIcon className="h-5 w-5 shrink-0" strokeWidth={active ? 2 : 1.8} />
                        <span className={`flex-1 text-sm font-medium ${active ? 'text-foreground' : ''}`}>
                          {t(link.label as any)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="h-2" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
