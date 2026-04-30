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
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-surface-3 rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-hover-overlay transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <div className={`w-10 h-6 rounded-full transition-colors ${item.value ? 'bg-[#0c8de6]' : 'bg-gray-600'} p-0.5`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${item.value ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  ) : item.value ? (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">{t('signOut')}</span>
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/20 text-red-500/70 rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">{t('deleteAccount')}</span>
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
