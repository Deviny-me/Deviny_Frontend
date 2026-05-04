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

  const inputClass = 'w-full h-10 px-3 bg-surface-2 rounded-xl text-sm text-foreground placeholder:text-faint-foreground focus:outline-none transition-colors'
  const selectClass = 'w-full h-10 px-3 bg-surface-2 rounded-xl text-sm text-foreground focus:outline-none transition-colors appearance-none'
  const sectionClass = 'rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5 space-y-4'
  const sectionHeaderClass = 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

  const avatarUrl = user?.avatarUrl
  const bannerUrl = user?.bannerUrl

  const renderToggle = (checked: boolean, onChange: (v: boolean) => void, disabled?: boolean) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ring-1 ring-inset ring-border-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={checked && !disabled
        ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }
        : undefined}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
      {!checked && <span className="absolute inset-0 rounded-full bg-surface-2" style={{ zIndex: -1 }} />}
    </button>
  )

  return (
    <div className="pb-8 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`${basePath}/profile`)}
          aria-label="Back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">{t('title')}</h1>
          <p className="text-sm text-muted-foreground truncate">{t('subtitle')}</p>
        </div>
      </div>

      {/* Avatar & Banner Section */}
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden">
        {/* Banner */}
        <div className="relative h-28 sm:h-36" style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}>
          {bannerUrl && (
            <img
              src={getMediaUrl(bannerUrl) || ''}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            <input type="file" id="ps-banner-upload" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <label
              htmlFor="ps-banner-upload"
              aria-label="Upload banner"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/45 backdrop-blur-md ring-1 ring-inset ring-white/15 text-white hover:bg-black/60 active:scale-95 transition-all cursor-pointer"
            >
              {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </label>
            {bannerUrl && (
              <button
                onClick={handleBannerDelete}
                aria-label="Delete banner"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/45 backdrop-blur-md ring-1 ring-inset ring-white/15 text-white/85 hover:text-red-300 hover:ring-red-300/40 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className="relative px-4 pb-4 sm:px-6 -mt-10 sm:-mt-12">
          <div className="relative inline-block">
            {avatarUrl ? (
              <img
                src={getMediaUrl(avatarUrl) || ''}
                alt="Avatar"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-background shadow-xl"
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-background shadow-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
              >
                <span className="text-2xl font-bold text-white">{user?.fullName?.charAt(0) || 'U'}</span>
              </div>
            )}
            <input type="file" id="ps-avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <label
              htmlFor="ps-avatar-upload"
              aria-label="Upload avatar"
              className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background shadow-lg cursor-pointer text-white active:scale-95 transition-transform z-10"
              style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
            >
              {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
            </label>
            {avatarUrl && (
              <button
                onClick={handleAvatarDelete}
                aria-label="Delete avatar"
                className="absolute -bottom-1 -left-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-1 ring-2 ring-background shadow-lg text-muted-foreground hover:text-red-500 active:scale-95 transition-all z-10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="mt-3">
            <p className="text-lg font-semibold text-foreground tracking-tight truncate">{user?.fullName || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <User className="w-3.5 h-3.5" />
          {t('personalInfo')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>{t('firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}

              placeholder={t('firstNamePlaceholder')}
            />
          </div>
          <div>
            <label className={labelClass}>{t('lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}

              placeholder={t('lastNamePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('emailLabel')}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              value={email}
              readOnly
              className={`${inputClass} pl-9 opacity-60 cursor-not-allowed`}
            />
          </div>
          <p className="text-xs text-faint-foreground mt-1.5">{t('emailCantChange')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>{t('gender')}</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`${selectClass} pr-9`}

              >
                <option value="">{t('selectGender')}</option>
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Other">{t('other')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('phoneLabel')}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                className={`${inputClass} pl-9`}

                placeholder={t('phonePlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <MapPin className="w-3.5 h-3.5" />
          {t('locationTitle')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>{t('country')}</label>
            <div className="rounded-xl overflow-hidden">
              <CountrySelect
                value={countryCode}
                onChange={(value) => { setCountryCode(value); setCity('') }}
                options={countryOptions}
                placeholder={tr('selectCountry')}
                searchPlaceholder={tr('searchCountry')}
                emptyText={tr('noCountryFound')}
                className="!h-11 !rounded-xl !border-0 !shadow-none !bg-surface-2 !ring-0 dark:!bg-surface-2"
                showSelectedMeta={false}
                renderValue={(option) => option ? option.label : ''}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('city')}</label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!countryCode}
                className="w-full h-11 px-3 pr-9 bg-surface-2 rounded-xl text-sm text-foreground focus:outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"

              >
                <option value="">{countryCode ? tr('selectCity') : tr('selectCountry')}</option>
                {availableCities.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info (trainer/nutritionist only) */}
      {isExpert && onSaveProfessional && (
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>
            <User className="w-3.5 h-3.5" />
            {t('professionalInfo')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={labelClass}>{t('primaryTitle')}</label>
              <input
                type="text"
                value={primaryTitle}
                onChange={(e) => setPrimaryTitle(e.target.value)}
                className={inputClass}

                placeholder={t('primaryTitlePlaceholder')}
              />
            </div>
            <div>
              <label className={labelClass}>{t('secondaryTitle')}</label>
              <input
                type="text"
                value={secondaryTitle}
                onChange={(e) => setSecondaryTitle(e.target.value)}
                className={inputClass}

                placeholder={t('secondaryTitlePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('experienceYears')}</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className={inputClass}

              placeholder="5"
              min="0"
              max="50"
            />
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <Bell className="w-3.5 h-3.5" />
          {t('notificationSettingsTitle')}
        </h3>

        {loadingNotificationSettings || !notificationSettings ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('notificationSettingsLoading')}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle -mx-1">
            {[
              { key: 'notificationsEnabled' as const, label: t('notificationsGlobal'), desc: t('notificationsGlobalDesc'), gated: false },
              { key: 'workoutRemindersEnabled' as const, label: t('notificationsWorkoutReminders'), desc: t('notificationsWorkoutRemindersDesc'), gated: true },
              { key: 'achievementFeedEnabled' as const, label: t('notificationsAchievementFeed'), desc: t('notificationsAchievementFeedDesc'), gated: true },
              { key: 'contentUpdatesEnabled' as const, label: t('notificationsContentUpdates'), desc: t('notificationsContentUpdatesDesc'), gated: true },
              { key: 'messagingEnabled' as const, label: t('notificationsMessaging'), desc: t('notificationsMessagingDesc'), gated: true },
            ].map((item) => {
              const disabled = savingNotificationSettings || (item.gated && !notificationSettings.notificationsEnabled)
              const checked = notificationSettings[item.key]
              return (
                <div key={item.key} className="flex items-center justify-between gap-3 px-1 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  {renderToggle(checked, (v) => updateNotificationSettings({ [item.key]: v } as Partial<NotificationSettings>), disabled)}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Profile Button */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full h-11 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('saveProfile')}
      </button>

      {/* Password Section */}
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden">
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 hover:bg-hover-overlay transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('changePassword')}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
        </button>

        {showPasswordSection && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 border-t border-border-subtle pt-4">
            <div>
              <label className={labelClass}>{t('currentPassword')}</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} pr-10`}

                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('newPassword')}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-10`}

                  placeholder={t('newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-colors"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('confirmNewPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}

                placeholder={t('confirmNewPasswordPlaceholder')}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full h-11 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {t('updatePassword')}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl ring-1 ring-inset shadow-xl text-sm font-medium backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-500/95 ring-emerald-400/30 text-white'
              : 'bg-red-500/95 ring-red-400/30 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
