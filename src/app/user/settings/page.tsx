'use client'

import { useUser } from '@/components/user/UserProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { 
  User,
  Bell,
  Shield,
  Globe,
  LogOut,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  LucideIcon
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLanguage, getLanguageLabel, Language } from '@/components/language/LanguageProvider'
import { DeleteAccountModal } from '@/components/shared/DeleteAccountModal'
import { useAccentColors } from '@/lib/theme/useAccentColors'

interface SettingsItem {
  icon: LucideIcon
  label: string
  action: () => void
  toggle?: boolean
  value?: string | boolean
}

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

export default function SettingsPage() {
  const t = useTranslations('userSettings')
  const router = useRouter()
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const accent = useAccentColors()
  const isDarkMode = theme === 'dark'
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    achievements: true,
    newPrograms: false,
    messages: true,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const handleDeleteSuccess = () => {
    window.location.href = '/auth/login'
  }

  const cycleLanguage = () => {
    const langs: Language[] = ['ru', 'en', 'az']
    const idx = langs.indexOf(language)
    const next = langs[(idx + 1) % langs.length]
    setLanguage(next)
  }

  const settingsSections: SettingsSection[] = [
    {
      title: t('account'),
      items: [
        { icon: User, label: t('editProfile'), action: () => router.push('/user/profile/settings') },
        { icon: Shield, label: t('privacySecurity'), action: () => {} },
      ]
    },
    {
      title: t('preferences'),
      items: [
        { 
          icon: isDarkMode ? Moon : Sun, 
          label: t('darkMode'), 
          toggle: true, 
          value: isDarkMode, 
          action: toggleTheme 
        },
        { icon: Globe, label: t('language'), value: getLanguageLabel(language), action: cycleLanguage },
      ]
    },
    {
      title: t('notifications'),
      items: [
        { 
          icon: Bell, 
          label: t('workoutReminders'), 
          toggle: true, 
          value: notifications.workoutReminders, 
          action: () => setNotifications(prev => ({ ...prev, workoutReminders: !prev.workoutReminders })) 
        },
        { 
          icon: Bell, 
          label: t('achievements'), 
          toggle: true, 
          value: notifications.achievements, 
          action: () => setNotifications(prev => ({ ...prev, achievements: !prev.achievements })) 
        },
        { 
          icon: Bell, 
          label: t('newPrograms'), 
          toggle: true, 
          value: notifications.newPrograms, 
          action: () => setNotifications(prev => ({ ...prev, newPrograms: !prev.newPrograms })) 
        },
        { 
          icon: Bell, 
          label: t('messages'), 
          toggle: true, 
          value: notifications.messages, 
          action: () => setNotifications(prev => ({ ...prev, messages: !prev.messages })) 
        },
      ]
    },
  ]

  return (
    <>
      <div className="space-y-5 pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
            <div className="border-b border-border-subtle px-4 py-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-hover-overlay"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <div
                      className={`h-6 w-11 flex-shrink-0 rounded-full p-0.5 transition-colors ${
                        item.value ? '' : 'bg-surface-2 ring-1 ring-inset ring-border-subtle'
                      }`}
                      style={item.value ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` } : undefined}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          item.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  ) : item.value ? (
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                      <ChevronRight className="h-4 w-4 text-faint-foreground" />
                    </div>
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-faint-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-4 py-2.5 text-sm font-semibold text-foreground transition-[color,box-shadow] duration-200 hover:text-red-500 hover:ring-red-500/40"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('signOut')}</span>
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-faint-foreground transition-colors hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{t('deleteAccount')}</span>
        </button>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
