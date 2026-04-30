'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { useRegister, GenderType, RegisterFormData } from '@/features/auth/hooks/useRegister'
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon, User, Dumbbell, Apple, ArrowLeft } from 'lucide-react'
import { CountrySelect, CountrySelectOption } from '@/features/auth/components/CountrySelect'
import { COUNTRIES_DATA, detectPreferredCountryCode, formatPhoneNumber, getCitiesForCountry, getCountries, getCountryName } from '@/lib/data/countries'
import { Spinner } from '@/components/ui/Spinner'
import { useLanguage } from '@/components/language/LanguageProvider'
import { cn } from '@/lib/utils/cn'
import { OtpVerification } from '@/features/auth/components/OtpVerification'
import { authService } from '@/features/auth/services/authService'

const SKIP_EMAIL_VERIFICATION_IN_DEV = process.env.NODE_ENV === 'development'

const roleConfig = {
  user:         { icon: User,     iconBg: 'bg-gradient-to-br from-user-100 to-user-200 dark:from-user-500/20 dark:to-user-600/20', iconColor: 'text-user-600 dark:text-user-400', gradientLine: 'from-user-400 via-user-500 to-user-600' },
  trainer:      { icon: Dumbbell, iconBg: 'bg-gradient-to-br from-trainer-100 to-trainer-200 dark:from-trainer-500/20 dark:to-trainer-600/20', iconColor: 'text-trainer-600 dark:text-trainer-400', gradientLine: 'from-trainer-400 via-trainer-500 to-trainer-600' },
  nutritionist: { icon: Apple,    iconBg: 'bg-gradient-to-br from-nutritionist-100 to-nutritionist-200 dark:from-nutritionist-500/20 dark:to-nutritionist-600/20', iconColor: 'text-nutritionist-600 dark:text-nutritionist-400', gradientLine: 'from-nutritionist-400 via-nutritionist-500 to-nutritionist-600' },
}

const inputBase = 'w-full px-4 py-3.5 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent'
const inputOk = 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
const inputErr = 'border-red-400 focus:ring-red-500'
const selectBase = 'w-full h-[54px] px-4 py-0 rounded-xl border bg-white/80 dark:bg-[#1a1a1a] text-gray-900 dark:text-white transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-[#222222] focus:outline-none focus:ring-2 focus:border-transparent appearance-none'
const selectPhoneCode = 'w-32 sm:w-36 flex-shrink-0'

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const injuryFileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('auth')
  const tr = useTranslations('auth.register')
  const tv = useTranslations('auth.validation')
  const { language } = useLanguage()
  
  // Registration step: 'form' | 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  
  const [role, setRole] = useState<RoleType | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [phone, setPhone] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('')
  const [gender, setGender] = useState<GenderType | undefined>()
  const [countryCode, setCountryCode] = useState<string>('')
  const [city, setCity] = useState('')
  const [hasInjuries, setHasInjuries] = useState(false)
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [injuryDocument, setInjuryDocument] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [injuryDragActive, setInjuryDragActive] = useState(false)

  const availableCities = countryCode ? getCitiesForCountry(countryCode, language) : []
  const selectedCountryName = countryCode ? getCountryName(countryCode, 'en') : ''
  const countries = getCountries(language)
  const phoneCountryOptions: CountrySelectOption[] = countries.map((country) => ({
    value: country.code,
    label: COUNTRIES_DATA[country.code].phoneCode,
    meta: country.name,
    countryCode: country.code,
    keywords: [country.code, country.name, COUNTRIES_DATA[country.code].phoneCode],
  }))
  const countryOptions: CountrySelectOption[] = countries.map((country) => ({
    value: country.code,
    label: country.name,
    meta: COUNTRIES_DATA[country.code].phoneCode,
    countryCode: country.code,
    keywords: [country.code, country.name, COUNTRIES_DATA[country.code].phoneCode],
  }))

  const phoneCountryData = COUNTRIES_DATA[phoneCountryCode]
  const phoneFormat = phoneCountryData?.phoneFormat || 'XXX XXX XXX'
  const maxPhoneDigits = phoneCountryData?.maxDigits || 10

  const GENDERS: { value: GenderType; label: string }[] = [
    { value: 'Male', label: tr('male') },
    { value: 'Female', label: tr('female') },
  ]

  const { loading, errors, register, clearErrors } = useRegister()

  const handlePhoneCountrySelect = (value: string) => {
    setPhoneCountryCode(value)
    setPhone('')

    if (countryCode !== value) {
      setCountryCode(value)
      setCity('')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const digits = value.replace(/\D/g, '')
    if (digits.length <= maxPhoneDigits) {
      const formatted = formatPhoneNumber(digits, phoneFormat)
      setPhone(formatted)
    }
  }

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    if (roleFromQuery && (roleFromQuery === 'user' || roleFromQuery === 'trainer' || roleFromQuery === 'nutritionist')) {
      setRole(roleFromQuery)
    } else {
      const roleFromStorage = getRole()
      if (roleFromStorage && (roleFromStorage === 'user' || roleFromStorage === 'trainer' || roleFromStorage === 'nutritionist')) {
        setRole(roleFromStorage)
      } else {
        router.push('/auth')
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    const detectedCountryCode = detectPreferredCountryCode(language)
    if (!detectedCountryCode) return

    setPhoneCountryCode((current) => current || detectedCountryCode)
    setCountryCode((current) => current || detectedCountryCode)
  }, [language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    clearErrors()
    setOtpError(null)
    
    // Validate form first (using useRegister's validation logic)
    const fullPhone = phone 
      ? `${COUNTRIES_DATA[phoneCountryCode]?.phoneCode || ''} ${phone}`.trim()
      : undefined
    
    const formData: RegisterFormData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      termsAccepted,
      phone: fullPhone,
      gender,
      country: selectedCountryName || undefined,
      city: city || undefined,
      hasInjuries,
      injuryDocument: hasInjuries ? injuryDocument || undefined : undefined,
    }

    if (role === 'trainer' || role === 'nutritionist') {
      formData.verificationDocument = verificationDocument || undefined
    }

    if (SKIP_EMAIL_VERIFICATION_IN_DEV) {
      await register(formData, role)
      return
    }
    
    // Send OTP to email before registration
    setIsSendingOtp(true)
    try {
      await authService.sendOtp(email)
      setStep('otp')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP'
      const errorMap: Record<string, string> = {
        'EMAIL_ALREADY_REGISTERED': tv('emailAlreadyRegistered'),
        'SERVER_UNAVAILABLE': tv('serverUnavailable'),
      }
      setOtpError(errorMap[message] || message)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleOtpVerified = async () => {
    if (!role) return
    
    const fullPhone = phone 
      ? `${COUNTRIES_DATA[phoneCountryCode]?.phoneCode || ''} ${phone}`.trim()
      : undefined
    
    const formData: RegisterFormData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      termsAccepted,
      phone: fullPhone,
      gender,
      country: selectedCountryName || undefined,
      city: city || undefined,
      hasInjuries,
      injuryDocument: hasInjuries ? injuryDocument || undefined : undefined,
    }

    if (role === 'trainer' || role === 'nutritionist') {
      formData.verificationDocument = verificationDocument || undefined
    }
    
    // Now complete the registration
    await register(formData, role)
  }

  const handleBackFromOtp = () => {
    setStep('form')
    setOtpError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    setVerificationDocument(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setVerificationDocument(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleInjuryDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setInjuryDragActive(true)
    } else if (e.type === 'dragleave') {
      setInjuryDragActive(false)
    }
  }

  const handleInjuryDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setInjuryDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleInjuryFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleInjuryFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    setInjuryDocument(file)
  }

  const handleInjuryFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleInjuryFileSelect(e.target.files[0])
    }
  }

  const removeInjuryFile = () => {
    setInjuryDocument(null)
    if (injuryFileInputRef.current) injuryFileInputRef.current.value = ''
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="w-7 h-7 text-red-500" />
    return <ImageIcon className="w-7 h-7 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!role) return null

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const isProfessional = isTrainer || isNutritionist
  const cfg = roleConfig[role]
  const Icon = cfg.icon

  // Show OTP verification step
  if (step === 'otp') {
    return (
      <OtpVerification
        email={email}
        onVerified={handleOtpVerified}
        onBack={handleBackFromOtp}
        variant={role}
      />
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto py-4 animate-fade-in-up">
      {/* Back button */}
      <Link
        href={`/auth/login?role=${role}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {tr('backToLogin')}
      </Link>

      {/* Role badge */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg', cfg.iconBg)}>
          <Icon className={cn('w-8 h-8', cfg.iconColor)} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isTrainer ? tr('titleTrainer') : isNutritionist ? tr('titleNutritionist') : tr('titleUser')}
        </h2>
      </div>

      {/* Form card */}
      <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8 animate-fade-in-up-delay-2">
        {/* Subtle top gradient line */}
        <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />
        {errors.general && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Personal info */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-px bg-gray-300 dark:bg-white/10" />
            {tr('personalInfo')}
          </p>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={cn(inputBase, errors.firstName ? inputErr : inputOk)}
                placeholder={tr('firstNamePlaceholder')}
                disabled={loading}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={cn(inputBase, errors.lastName ? inputErr : inputOk)}
                placeholder={tr('lastNamePlaceholder')}
                disabled={loading}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(inputBase, errors.email ? inputErr : inputOk)}
              placeholder={tr('emailPlaceholder')}
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputBase, 'pr-12', errors.password ? inputErr : inputOk)}
                placeholder={tr('passwordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(inputBase, 'pr-12', errors.confirmPassword ? inputErr : inputOk)}
                placeholder={tr('confirmPasswordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Additional fields (all roles) */}
          <div className="border-t border-gray-200/40 dark:border-white/[0.06] pt-5 mt-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-gray-300 dark:bg-white/10" />
              {isProfessional ? tr('professionalInfo') : tr('additionalInfo')}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200/60 dark:border-white/[0.08] p-4 bg-gray-50/40 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{tr('hasInjuriesQuestion')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr('injuryUploadHint')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hasInjuries}
                onClick={() => {
                  setHasInjuries((prev) => {
                    const next = !prev
                    if (!next) {
                      removeInjuryFile()
                    }
                    return next
                  })
                }}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  hasInjuries ? 'bg-primary-500' : 'bg-gray-300 dark:bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                    hasInjuries ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          {hasInjuries && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('injuryUploadLabel')}</label>

              {!injuryDocument ? (
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
                    injuryDragActive
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-500/10'
                      : errors.injuryDocument
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-gray-300/60 hover:border-primary-400/50 bg-gray-50/30 dark:border-white/[0.08] dark:hover:border-white/[0.15] dark:bg-white/[0.02]'
                  )}
                  onDragEnter={handleInjuryDrag}
                  onDragLeave={handleInjuryDrag}
                  onDragOver={handleInjuryDrag}
                  onDrop={handleInjuryDrop}
                >
                  <input
                    ref={injuryFileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleInjuryFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-primary-100/50 dark:bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-primary-500/60 dark:text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-primary-600">{tr('selectFile')}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{tr('allowedFormats')}</p>
                </div>
              ) : (
                <div className="border border-amber-200/30 dark:border-white/10 rounded-xl p-4 bg-amber-50/30 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(injuryDocument)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{injuryDocument.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(injuryDocument.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeInjuryFile}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      disabled={loading}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {errors.injuryDocument && <p className="mt-1 text-sm text-red-600">{errors.injuryDocument}</p>}
            </div>
          )}

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('gender')}{isProfessional ? ' *' : ''}</label>
            <select
              value={gender || ''}
              onChange={(e) => setGender(e.target.value as GenderType || undefined)}
              className={cn(selectBase, errors.gender ? inputErr : inputOk)}
              disabled={loading}
            >
              <option value="">{tr('selectGender')}</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('phone')}{isProfessional ? ' *' : ''}</label>
            <div className="flex flex-col gap-2 min-w-0 sm:flex-row">
              <CountrySelect
                value={phoneCountryCode}
                onChange={handlePhoneCountrySelect}
                options={phoneCountryOptions}
                placeholder={tr('phoneCode')}
                searchPlaceholder={tr('searchCountryCode')}
                emptyText={tr('noPhoneCodeFound')}
                className={cn(selectPhoneCode, errors.phone ? inputErr : inputOk)}
                panelClassName="w-[24rem] max-w-[calc(100vw-2rem)]"
                compact
                renderValue={(option) => option ? option.label : ''}
                disabled={loading}
              />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={cn(inputBase, 'flex-1 min-w-0', errors.phone ? inputErr : inputOk)}
                placeholder={phoneFormat.replace(/X/g, '9')}
                disabled={loading}
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Location */}
          <div className="border-t border-gray-200/40 dark:border-white/[0.06] pt-5 mt-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-gray-300 dark:bg-white/10" />
              {tr('locationInfo')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('country')}{isProfessional ? ' *' : ''}</label>
              <CountrySelect
                value={countryCode}
                onChange={(value) => { setCountryCode(value); setCity('') }}
                options={countryOptions}
                placeholder={tr('selectCountry')}
                searchPlaceholder={tr('searchCountry')}
                emptyText={tr('noCountryFound')}
                className={cn(errors.country ? inputErr : inputOk)}
                showSelectedMeta={false}
                renderValue={(option) => option ? option.label : ''}
                disabled={loading}
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('city')}{isProfessional ? ' *' : ''}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={cn(selectBase, errors.city ? inputErr : inputOk)}
                disabled={loading || !countryCode}
              >
                <option value="">{countryCode ? tr('selectCity') : tr('selectCountry')}</option>
                {availableCities.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>
          </div>

          {/* Professional-only: Document upload */}
          {isProfessional && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tr('documentLabel')}</label>
                
                {!verificationDocument ? (
                  <div
                    className={cn(
                      'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
                      dragActive
                        ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-500/10'
                        : errors.verificationDocument
                          ? 'border-red-400 bg-red-50/50'
                          : 'border-gray-300/60 hover:border-primary-400/50 bg-gray-50/30 dark:border-white/[0.08] dark:hover:border-white/[0.15] dark:bg-white/[0.02]'
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-primary-100/50 dark:bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-primary-500/60 dark:text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-primary-600">{tr('selectFile')}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{tr('allowedFormats')}</p>
                  </div>
                ) : (
                  <div className="border border-amber-200/30 dark:border-white/10 rounded-xl p-4 bg-amber-50/30 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(verificationDocument)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{verificationDocument.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(verificationDocument.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        disabled={loading}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                
                {errors.verificationDocument && <p className="mt-1 text-sm text-red-600">{errors.verificationDocument}</p>}
              </div>
            </>
          )}

          {/* Terms */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => !loading && setTermsAccepted(!termsAccepted)}
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                  termsAccepted
                    ? 'bg-primary-500 border-primary-500 shadow-sm shadow-primary-500/30'
                    : errors.termsAccepted ? 'border-red-500 bg-white dark:bg-white/5' : 'border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 hover:border-primary-400'
                )}
              >
                {termsAccepted && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {tr('termsAccept')}{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
                  {tr('termsLink')}
                </Link>
              </span>
            </label>
            {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
          </div>

          {/* OTP Error display */}
          {otpError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              {otpError}
            </div>
          )}

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={loading || isSendingOtp || !termsAccepted}
          >
            {(loading || isSendingOtp) ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="white" />
                {isSendingOtp ? tr('sendingOtp') : tr('submitting')}
              </span>
            ) : tr('submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/60 dark:border-white/[0.06]" /></div>
        </div>

        {/* Links */}
        <div className="text-center pt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tr('hasAccount')}{' '}
            <Link
              href={`/auth/login?role=${role}`}
              className="text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-semibold transition-all"
            >
              {tr('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <Spinner size="md" color="primary" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

