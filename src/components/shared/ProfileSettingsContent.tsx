'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useUser } from '@/components/user/UserProvider'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { updateUserProfile, changePassword, uploadAvatar, deleteAvatar, uploadBanner, deleteBanner } from '@/lib/api/userApi'
import { notificationsApi } from '@/lib/api/notificationsApi'
import { getMediaUrl } from '@/lib/config'
import { getCountries, getCitiesForCountry, getCountryName, translateCityName, resolveCountryCodeByName, COUNTRIES_DATA } from '@/lib/data/countries'
import { CountrySelect, type CountrySelectOption } from '@/features/auth/components/CountrySelect'
import { NotificationSettings } from '@/types/notification'
import {
  ArrowLeft,
  Camera,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  User,
  Lock,
  Save,
  ChevronDown,
  Bell,
} from 'lucide-react'

interface ProfileSettingsContentProps {
  basePath: string
  role: 'user' | 'trainer' | 'nutritionist'
  /** For trainer/nutritionist: additional save handler for professional fields */
  onSaveProfessional?: (data: {
    primaryTitle?: string
    secondaryTitle?: string
    experienceYears?: number
    about?: string
  }) => Promise<void>
  /** For trainer/nutritionist: initial professional data */
  professionalData?: {
    primaryTitle?: string
    secondaryTitle?: string
    experienceYears?: number
    about?: string
  }
  /** Expert avatar upload/delete (uses different endpoint) */
  expertAvatarUpload?: (file: File) => Promise<{ avatarUrl: string }>
  expertAvatarDelete?: () => Promise<void>
  /** Expert banner upload/delete */
  expertBannerUpload?: (file: File) => Promise<{ bannerUrl: string }>
  expertBannerDelete?: () => Promise<void>
}

export function ProfileSettingsContent({
  basePath,
  role,
  onSaveProfessional,
  professionalData,
  expertAvatarUpload,
  expertAvatarDelete,
  expertBannerUpload,
  expertBannerDelete,
}: ProfileSettingsContentProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const { user, updateUser, refreshUser } = useUser()
  const accent = useAccentColors()
  const t = useTranslations('profileSettings')
  const tc = useTranslations('common')
  const tr = useTranslations('auth.register')

  // Personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')

  // Professional fields (trainer/nutritionist)
  const [primaryTitle, setPrimaryTitle] = useState('')
  const [secondaryTitle, setSecondaryTitle] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [about, setAbout] = useState('')

  // Password
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // State
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(true)
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false)

  const countries = getCountries(language)
  const countryOptions: CountrySelectOption[] = countries.map((country) => ({
    value: country.code,
    label: country.name,
    meta: COUNTRIES_DATA[country.code].phoneCode,
    countryCode: country.code,
    keywords: [country.code, country.name, COUNTRIES_DATA[country.code].phoneCode],
  }))
  const availableCities = countryCode ? getCitiesForCountry(countryCode, language) : []
  const isExpert = role === 'trainer' || role === 'nutritionist'

  // Initialize form from user data
  useEffect(() => {
    if (!user) return
    const nameParts = user.fullName?.split(' ') || []
    setFirstName(nameParts[0] || '')
    setLastName(nameParts.slice(1).join(' ') || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setGender(user.gender || '')
    setBio(user.bio || '')

    const resolved = resolveCountryCodeByName(user.country) || ''
    setCountryCode(resolved)

    if (resolved && user.city) {
      const cityMatch = getCitiesForCountry(resolved, language).find(c =>
        c.value.toLowerCase() === user.city!.toLowerCase() ||
        c.label.toLowerCase() === user.city!.toLowerCase() ||
        translateCityName(c.value, language).toLowerCase() === user.city!.toLowerCase()
      )
      setCity(cityMatch?.value || '')
    } else {
      setCity('')
    }
  }, [user, language])

  // Initialize professional fields
  useEffect(() => {
    if (!professionalData) return
    setPrimaryTitle(professionalData.primaryTitle || '')
    setSecondaryTitle(professionalData.secondaryTitle || '')
    setExperienceYears(professionalData.experienceYears?.toString() || '')
    setAbout(professionalData.about || '')
  }, [professionalData])

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        setLoadingNotificationSettings(true)
        const settings = await notificationsApi.getSettings()
        setNotificationSettings(settings)
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      } finally {
        setLoadingNotificationSettings(false)
      }
    }

    loadNotificationSettings()
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const englishCountry = countryCode ? getCountryName(countryCode, 'en') : ''

      await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gender: gender || undefined,
        country: englishCountry || undefined,
        city: city || undefined,
        bio: bio.trim() || undefined,
      })

      // Save professional fields if expert
      if (isExpert && onSaveProfessional) {
        await onSaveProfessional({
          primaryTitle: primaryTitle.trim() || undefined,
          secondaryTitle: secondaryTitle.trim() || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          about: about.trim() || undefined,
        })
      }

      await refreshUser()
      router.push(`${basePath}/profile`)
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast(t('profileSaveError'), 'error')
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast(t('passwordMinLength'), 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast(t('passwordsMismatch'), 'error')
      return
    }

    try {
      setSavingPassword(true)
      await changePassword(currentPassword, newPassword)
      showToast(t('passwordChanged'), 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('passwordChangeError')
      showToast(msg, 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('avatarSizeLimit'), 'error')
      return
    }

    try {
      setUploadingAvatar(true)
      const uploadFn = expertAvatarUpload || uploadAvatar
      const result = await uploadFn(file)
      updateUser({ avatarUrl: result.avatarUrl })
      showToast(t('avatarUpdated'), 'success')
    } catch {
      showToast(t('avatarUploadError'), 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    try {
      const deleteFn = expertAvatarDelete || deleteAvatar
      await deleteFn()
      updateUser({ avatarUrl: null })
      showToast(t('avatarDeleted'), 'success')
    } catch {
      showToast(t('avatarDeleteError'), 'error')
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) {
      showToast(t('bannerSizeLimit'), 'error')
      return
    }

    try {
      setUploadingBanner(true)
      const uploadFn = expertBannerUpload || uploadBanner
      const result = await uploadFn(file)
      updateUser({ bannerUrl: result.bannerUrl })
      showToast(t('bannerUpdated'), 'success')
    } catch {
      showToast(t('bannerUploadError'), 'error')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerDelete = async () => {
    try {
      const deleteFn = expertBannerDelete || deleteBanner
      await deleteFn()
      updateUser({ bannerUrl: null })
      showToast(t('bannerDeleted'), 'success')
    } catch {
      showToast(t('bannerDeleteError'), 'error')
    }
  }

  const updateNotificationSettings = async (patch: Partial<NotificationSettings>) => {
    if (!notificationSettings) return

    const previous = notificationSettings
    const optimistic = { ...notificationSettings, ...patch }
    setNotificationSettings(optimistic)

    try {
      setSavingNotificationSettings(true)
      const saved = await notificationsApi.updateSettings(patch)
      setNotificationSettings(saved)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      setNotificationSettings(previous)
      showToast(t('notificationSettingsSaveError'), 'error')
    } finally {
      setSavingNotificationSettings(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all'
  const selectClass = 'w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none'

  const avatarUrl = user?.avatarUrl
  const bannerUrl = user?.bannerUrl

  return (
    <div className="pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`${basePath}/profile`)}
          className="p-2 rounded-xl hover:bg-surface-1 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Avatar & Banner Section */}
      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        {/* Banner */}
        <div className="relative h-28 sm:h-36" style={{ background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` }}>
          {bannerUrl && (
            <img
              src={getMediaUrl(bannerUrl) || ''}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <input type="file" id="ps-banner-upload" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <label
              htmlFor="ps-banner-upload"
              className="p-1.5 bg-black/45 rounded-full border border-white/20 hover:bg-black/60 transition-colors cursor-pointer"
            >
              {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </label>
            {bannerUrl && (
              <button
                onClick={handleBannerDelete}
                className="p-1.5 bg-black/45 rounded-full border border-white/20 hover:bg-red-500/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className="relative px-4 pb-4 sm:px-6 -mt-10">
          <div className="relative inline-block">
            {avatarUrl ? (
              <img
                src={getMediaUrl(avatarUrl) || ''}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#1A1A1A] shadow-xl"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1A1A1A] shadow-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
              >
                <span className="text-xl font-bold text-white">{user?.fullName?.charAt(0) || 'U'}</span>
              </div>
            )}
            <input type="file" id="ps-avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <label
              htmlFor="ps-avatar-upload"
              className="absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-white dark:border-[#1A1A1A] shadow-lg cursor-pointer z-10"
              style={{ background: accent.primary }}
            >
              {uploadingAvatar ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Pencil className="w-3 h-3 text-white" />}
            </label>
            {avatarUrl && (
              <button
                onClick={handleAvatarDelete}
                className="absolute bottom-0 left-0 p-1.5 bg-red-500 hover:bg-red-600 rounded-full border-2 border-white dark:border-[#1A1A1A] shadow-lg z-10"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
          <div className="mt-2">
            <p className="text-lg font-semibold text-foreground">{user?.fullName || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-surface-3 rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" />
          {t('personalInfo')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
              placeholder={t('firstNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
              placeholder={t('lastNamePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('emailLabel')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              readOnly
              className={`${inputClass} pl-10 opacity-60 cursor-not-allowed`}
            />
          </div>
          <p className="text-xs text-faint-foreground mt-1">{t('emailCantChange')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('gender')}</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={selectClass}
            style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
          >
            <option value="">{t('selectGender')}</option>
            <option value="Male">{t('male')}</option>
            <option value="Female">{t('female')}</option>
            <option value="Other">{t('other')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('phoneLabel')}</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              className={`${inputClass} pl-10`}
              style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
              placeholder={t('phonePlaceholder')}
            />
          </div>
        </div>

      </div>

      {/* Location */}
      <div className="bg-surface-3 rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t('locationTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('country')}</label>
            <CountrySelect
              value={countryCode}
              onChange={(value) => { setCountryCode(value); setCity('') }}
              options={countryOptions}
              placeholder={tr('selectCountry')}
              searchPlaceholder={tr('searchCountry')}
              emptyText={tr('noCountryFound')}
              className="w-full h-[50px] rounded-xl border-border bg-background text-foreground hover:border-border focus:ring-primary-500/80 dark:bg-background"
              showSelectedMeta={false}
              renderValue={(option) => option ? option.label : ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('city')}</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!countryCode}
              className={`${selectClass} disabled:opacity-50`}
              style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
            >
              <option value="">{countryCode ? tr('selectCity') : tr('selectCountry')}</option>
              {availableCities.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Professional Info (trainer/nutritionist only) */}
      {isExpert && onSaveProfessional && (
        <div className="bg-surface-3 rounded-xl border border-border p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('professionalInfo')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('primaryTitle')}</label>
              <input
                type="text"
                value={primaryTitle}
                onChange={(e) => setPrimaryTitle(e.target.value)}
                className={inputClass}
                style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                placeholder={t('primaryTitlePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('secondaryTitle')}</label>
              <input
                type="text"
                value={secondaryTitle}
                onChange={(e) => setSecondaryTitle(e.target.value)}
                className={inputClass}
                style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                placeholder={t('secondaryTitlePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('experienceYears')}</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className={inputClass}
              style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
              placeholder="5"
              min="0"
              max="50"
            />
          </div>

        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-surface-3 rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t('notificationSettingsTitle')}
        </h3>

        {loadingNotificationSettings || !notificationSettings ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('notificationSettingsLoading')}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notificationsGlobal')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsGlobalDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.notificationsEnabled}
                onChange={(e) => updateNotificationSettings({ notificationsEnabled: e.target.checked })}
                disabled={savingNotificationSettings}
                className="h-5 w-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notificationsWorkoutReminders')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsWorkoutRemindersDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.workoutRemindersEnabled}
                onChange={(e) => updateNotificationSettings({ workoutRemindersEnabled: e.target.checked })}
                disabled={savingNotificationSettings || !notificationSettings.notificationsEnabled}
                className="h-5 w-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notificationsAchievementFeed')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsAchievementFeedDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.achievementFeedEnabled}
                onChange={(e) => updateNotificationSettings({ achievementFeedEnabled: e.target.checked })}
                disabled={savingNotificationSettings || !notificationSettings.notificationsEnabled}
                className="h-5 w-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notificationsContentUpdates')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsContentUpdatesDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.contentUpdatesEnabled}
                onChange={(e) => updateNotificationSettings({ contentUpdatesEnabled: e.target.checked })}
                disabled={savingNotificationSettings || !notificationSettings.notificationsEnabled}
                className="h-5 w-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notificationsMessaging')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationsMessagingDesc')}</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.messagingEnabled}
                onChange={(e) => updateNotificationSettings({ messagingEnabled: e.target.checked })}
                disabled={savingNotificationSettings || !notificationSettings.notificationsEnabled}
                className="h-5 w-5 rounded border-border"
              />
            </label>
          </div>
        )}
      </div>

      {/* Save Profile Button */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        style={{ background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {t('saveProfile')}
      </button>

      {/* Password Section */}
      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between px-4 py-3 sm:px-5 hover:bg-hover-overlay transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('changePassword')}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
        </button>

        {showPasswordSection && (
          <div className="px-4 pb-4 sm:px-5 space-y-4 border-t border-border pt-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('currentPassword')}</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('newPassword')}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                  placeholder={t('newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('confirmNewPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                placeholder={t('confirmNewPasswordPlaceholder')}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              style={{ background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` }}
            >
              {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {t('updatePassword')}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-500/90 text-white'
            : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
