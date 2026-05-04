'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { Eye, EyeOff, User, Dumbbell, Apple, ArrowLeft, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { cn } from '@/lib/utils/cn'
import { getRememberMePreferences, saveRememberMePreferences, clearRememberMePreferences } from '@/lib/utils/cookies'
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

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const tv = useTranslations('auth.validation')
  const [role, setRole] = useState<RoleType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { login, isLoading, error, setError } = useLogin()

  // Load remembered preferences from cookies on mount
  useEffect(() => {
    const prefs = getRememberMePreferences()
    if (prefs.rememberMe && prefs.email) {
      setFormData(prev => ({
        ...prev,
        email: prefs.email,
        rememberMe: true,
      }))
    }
  }, [])

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    const roleFromStorage = getRole()
    const validRole = ['user', 'trainer', 'nutritionist'].includes(roleFromQuery) ? roleFromQuery : roleFromStorage

    if (!validRole || !['user', 'trainer', 'nutritionist'].includes(validRole)) {
      router.push('/auth')
      return
    }

    setRole(validRole)
  }, [searchParams, router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.email) {
      errors.email = tv('emailRequired')
    } else if (!validateEmail(formData.email)) {
      errors.email = tv('emailInvalid')
    }

    if (!formData.password) {
      errors.password = tv('passwordRequired')
    } else if (formData.password.length < 6) {
      errors.password = tv('passwordMin')
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm() || !role) return

    try {
      await login({
        email: formData.email,
        password: formData.password,
        role,
        rememberMe: formData.rememberMe,
      })

      // Save or clear remember me preferences in cookies
      if (formData.rememberMe) {
        saveRememberMePreferences(formData.email, role)
      } else {
        clearRememberMePreferences()
      }

      router.push(role === 'user' ? '/user' : role === 'nutritionist' ? '/nutritionist' : '/trainer')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const cfg = authRoleConfig[role]
  const Icon = roleIcons[role]

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      {/* Back button */}
      <Link
        href="/auth"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200 ease-out-expo" />
        {t('login.backToRoles')}
      </Link>

      {/* Role badge */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
        <div className={cn('h-16 w-16 rounded-2xl grid place-items-center mb-4', cfg.iconBg)}>
          <Icon className={cn('h-8 w-8', cfg.iconColor)} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight text-center">
          {isTrainer ? t('login.titleTrainer') : isNutritionist ? t('login.titleNutritionist') : t('login.titleUser')}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{t('tagline')}</p>
      </div>

      {/* Form card */}
      <div className={cn(authCard, 'animate-fade-in-up-delay-2')}>
        <div className={authAccentLine(cfg.gradientLine)} />

        {error && (
          <div className={authErrorBox}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className={authLabel} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
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

          {/* Password */}
          <div>
            <label className={authLabel} htmlFor="login-password">{t('login.password')}</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={cn(authInputBase, 'pr-12', fieldErrors.password && authInputErr)}
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.password) || undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-[background-color,color] duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className={authFieldError}>
                <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between">
            <label
              className="flex items-center cursor-pointer group select-none"
              onClick={() => !isLoading && setFormData({ ...formData, rememberMe: !formData.rememberMe })}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-[5px] flex items-center justify-center flex-shrink-0 transition-[background-color,box-shadow,border-color] duration-200 ease-out-expo',
                  formData.rememberMe
                    ? 'bg-primary-500 ring-1 ring-primary-500'
                    : 'bg-surface-2 ring-1 ring-inset ring-border-strong group-hover:ring-primary-400',
                )}
              >
                {formData.rememberMe && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <span className="ml-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {t('login.rememberMe')}
              </span>
            </label>

            <Link
              href={`/auth/forgot-password?role=${role}`}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 font-medium transition-colors"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            loading={isLoading}
          >
            {isLoading ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-7" aria-hidden>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </div>

        {/* Links */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link
              href={`/auth/register?role=${role}`}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 font-semibold transition-colors"
            >
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <Spinner size="md" color="primary" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
