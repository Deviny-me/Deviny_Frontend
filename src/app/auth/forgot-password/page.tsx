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
import {
  authCard,
  authInputBase,
  authInputErr,
  authLabel,
  authErrorBox,
  authFieldError,
  authAccentLine,
  authRoleConfig,
} from '@/features/auth/styles'

const roleIcons = { user: User, trainer: Dumbbell, nutritionist: Apple }

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
  const cfg = authRoleConfig[role]
  const Icon = roleIcons[role]

  // Success step
  if (step === 'success') {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        <div className={authCard}>
          <div className={authAccentLine(cfg.gradientLine)} />

          <div className="flex flex-col items-center text-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 grid place-items-center mb-6">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-3">
              {t('forgotPassword.successTitle')}
            </h2>
            <p className="text-muted-foreground mb-8">
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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200 ease-out-expo" />
          {t('forgotPassword.backToLogin')}
        </Link>

        <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
          <div className={cn('h-16 w-16 rounded-2xl grid place-items-center mb-4', cfg.iconBg)}>
            <KeyRound className={cn('h-8 w-8', cfg.iconColor)} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight text-center">
            {t('forgotPassword.verifyTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {t('forgotPassword.verifySubtitle')}
          </p>
        </div>

        <div className={cn(authCard, 'animate-fade-in-up-delay-2')}>
          <div className={authAccentLine(cfg.gradientLine)} />

          <OtpVerification
            email={email}
            role={role}
            onVerified={handleOtpVerified}
            onResend={handleResendOtp}
            purpose="password_reset"
          />

          <button
            onClick={() => setStep('email')}
            className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200 ease-out-expo" />
          {t('forgotPassword.backToLogin')}
        </Link>

        <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
          <div className={cn('h-16 w-16 rounded-2xl grid place-items-center mb-4', cfg.iconBg)}>
            <KeyRound className={cn('h-8 w-8', cfg.iconColor)} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight text-center">
            {t('forgotPassword.newPasswordTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {t('forgotPassword.newPasswordSubtitle')}
          </p>
        </div>

        <div className={cn(authCard, 'animate-fade-in-up-delay-2')}>
          <div className={authAccentLine(cfg.gradientLine)} />

          {error && (
            <div className={authErrorBox}>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className={authLabel} htmlFor="reset-new-password">
                {t('forgotPassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: '' })
                  }}
                  className={cn(authInputBase, 'pr-12', fieldErrors.newPassword && authInputErr)}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-[background-color,color] duration-200 ease-out-expo"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className={authFieldError}>
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={authLabel} htmlFor="reset-confirm-password">
                {t('forgotPassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                  }}
                  className={cn(authInputBase, 'pr-12', fieldErrors.confirmPassword && authInputErr)}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-[background-color,color] duration-200 ease-out-expo"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className={authFieldError}>
                  <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
              size="lg"
              fullWidth
              type="submit"
              loading={isLoading}
            >
              {isLoading ? t('forgotPassword.resetting') : t('forgotPassword.resetButton')}
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
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200 ease-out-expo" />
        {t('forgotPassword.backToLogin')}
      </Link>

      <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
        <div className={cn('h-16 w-16 rounded-2xl grid place-items-center mb-4', cfg.iconBg)}>
          <KeyRound className={cn('h-8 w-8', cfg.iconColor)} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight text-center">
          {t('forgotPassword.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <div className={cn(authCard, 'animate-fade-in-up-delay-2')}>
        <div className={authAccentLine(cfg.gradientLine)} />

        {error && (
          <div className={authErrorBox}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label className={authLabel} htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
              }}
              className={cn(authInputBase, fieldErrors.email && authInputErr)}
              placeholder="name@example.com"
              disabled={isLoading}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
            />
            {fieldErrors.email && (
              <p className={authFieldError}>
                <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            loading={isLoading}
          >
            {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
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
