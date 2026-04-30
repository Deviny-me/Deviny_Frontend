'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { RoleType } from '@/features/auth/types/role.types'
import { User, Dumbbell, Apple, ArrowLeft, Eye, EyeOff, Check, KeyRound } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils/cn'
import { authService } from '@/features/auth/services/authService'
import { OtpVerification } from '@/features/auth/components/OtpVerification'

const roleConfig = {
  user:         { icon: User,     iconBg: 'bg-gradient-to-br from-user-100 to-user-200 dark:from-user-500/20 dark:to-user-600/20', iconColor: 'text-user-600 dark:text-user-400', ring: 'focus-within:ring-user-500', gradientLine: 'from-user-400 via-user-500 to-user-600' },
  trainer:      { icon: Dumbbell, iconBg: 'bg-gradient-to-br from-trainer-100 to-trainer-200 dark:from-trainer-500/20 dark:to-trainer-600/20', iconColor: 'text-trainer-600 dark:text-trainer-400', ring: 'focus-within:ring-trainer-500', gradientLine: 'from-trainer-400 via-trainer-500 to-trainer-600' },
  nutritionist: { icon: Apple,    iconBg: 'bg-gradient-to-br from-nutritionist-100 to-nutritionist-200 dark:from-nutritionist-500/20 dark:to-nutritionist-600/20', iconColor: 'text-nutritionist-600 dark:text-nutritionist-400', ring: 'focus-within:ring-nutritionist-500', gradientLine: 'from-nutritionist-400 via-nutritionist-500 to-nutritionist-600' },
}

type Step = 'email' | 'otp' | 'password' | 'success'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const tv = useTranslations('auth.validation')
  const [role, setRole] = useState<RoleType | null>(null)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    const validRole = ['user', 'trainer', 'nutritionist'].includes(roleFromQuery) ? roleFromQuery : 'user'
    setRole(validRole)
  }, [searchParams])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!email) {
      setFieldErrors({ email: tv('emailRequired') })
      return
    }
    if (!validateEmail(email)) {
      setFieldErrors({ email: tv('emailInvalid') })
      return
    }

    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep('otp')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'ACCOUNT_NOT_FOUND') {
        setError(t('forgotPassword.accountNotFound'))
      } else {
        setError(msg || t('forgotPassword.sendFailed'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerified = (code?: string) => {
    if (code) {
      setOtpCode(code)
    }
    setStep('password')
  }

  const handleResendOtp = async () => {
    await authService.forgotPassword(email)
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = tv('passwordRequired')
    } else if (newPassword.length < 6) {
      errors.newPassword = tv('passwordMin')
    }

    if (!confirmPassword) {
      errors.confirmPassword = tv('confirmPasswordRequired')
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = tv('passwordMismatch')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(email, otpCode, newPassword)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgotPassword.resetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const cfg = roleConfig[role]
  const Icon = cfg.icon

  // Success step
  if (step === 'success') {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8">
          <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />
          
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('forgotPassword.successTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t('forgotPassword.successMessage')}
            </p>
            <Button
              variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
              size="lg"
              fullWidth
              onClick={() => router.push(`/auth/login?role=${role}`)}
            >
              {t('forgotPassword.backToLogin')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // OTP step
  if (step === 'otp') {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <Link
          href={`/auth/login?role=${role}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('forgotPassword.backToLogin')}
        </Link>

        <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
          <div className={cn('w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-lg', cfg.iconBg)}>
            <KeyRound className={cn('w-9 h-9', cfg.iconColor)} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('forgotPassword.verifyTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            {t('forgotPassword.verifySubtitle')}
          </p>
        </div>

        <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8 animate-fade-in-up-delay-2">
          <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />

          <OtpVerification
            email={email}
            role={role}
            onVerified={handleOtpVerified}
            onResend={handleResendOtp}
            purpose="password_reset"
          />

          <button
            onClick={() => setStep('email')}
            className="mt-6 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t('forgotPassword.changeEmail')}
          </button>
        </div>
      </div>
    )
  }

  // Password step
  if (step === 'password') {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <Link
          href={`/auth/login?role=${role}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('forgotPassword.backToLogin')}
        </Link>

        <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
          <div className={cn('w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-lg', cfg.iconBg)}>
            <KeyRound className={cn('w-9 h-9', cfg.iconColor)} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('forgotPassword.newPasswordTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            {t('forgotPassword.newPasswordSubtitle')}
          </p>
        </div>

        <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8 animate-fade-in-up-delay-2">
          <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />

          {error && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('forgotPassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: '' })
                  }}
                  className={cn(
                    'w-full px-4 py-3.5 pr-12 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent',
                    fieldErrors.newPassword ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
                  )}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('forgotPassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                  }}
                  className={cn(
                    'w-full px-4 py-3.5 pr-12 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent',
                    fieldErrors.confirmPassword ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
                  )}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
              size="lg"
              fullWidth
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" color="white" />
                  {t('forgotPassword.resetting')}
                </span>
              ) : t('forgotPassword.resetButton')}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Email step (default)
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <Link
        href={`/auth/login?role=${role}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('forgotPassword.backToLogin')}
      </Link>

      <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
        <div className={cn('w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-lg', cfg.iconBg)}>
          <KeyRound className={cn('w-9 h-9', cfg.iconColor)} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('forgotPassword.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8 animate-fade-in-up-delay-2">
        <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />

        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
              }}
              className={cn(
                'w-full px-4 py-3.5 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent',
                fieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
              )}
              placeholder="name@example.com"
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="white" />
                {t('forgotPassword.sending')}
              </span>
            ) : t('forgotPassword.sendCode')}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
