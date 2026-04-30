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

const roleConfig = {
  user:         { icon: User,     iconBg: 'bg-gradient-to-br from-user-100 to-user-200 dark:from-user-500/20 dark:to-user-600/20', iconColor: 'text-user-600 dark:text-user-400', ring: 'focus-within:ring-user-500', gradientLine: 'from-user-400 via-user-500 to-user-600' },
  trainer:      { icon: Dumbbell, iconBg: 'bg-gradient-to-br from-trainer-100 to-trainer-200 dark:from-trainer-500/20 dark:to-trainer-600/20', iconColor: 'text-trainer-600 dark:text-trainer-400', ring: 'focus-within:ring-trainer-500', gradientLine: 'from-trainer-400 via-trainer-500 to-trainer-600' },
  nutritionist: { icon: Apple,    iconBg: 'bg-gradient-to-br from-nutritionist-100 to-nutritionist-200 dark:from-nutritionist-500/20 dark:to-nutritionist-600/20', iconColor: 'text-nutritionist-600 dark:text-nutritionist-400', ring: 'focus-within:ring-nutritionist-500', gradientLine: 'from-nutritionist-400 via-nutritionist-500 to-nutritionist-600' },
}

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
  const cfg = roleConfig[role]
  const Icon = cfg.icon

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      {/* Back button */}
      <Link
        href="/auth"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('login.backToRoles')}
      </Link>

      {/* Role badge */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up-delay-1">
        <div className={cn('w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-lg', cfg.iconBg)}>
          <Icon className={cn('w-9 h-9', cfg.iconColor)} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {isTrainer ? t('login.titleTrainer') : isNutritionist ? t('login.titleNutritionist') : t('login.titleUser')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('tagline')}</p>
      </div>

      {/* Form card */}
      <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8 animate-fade-in-up-delay-2">
        {/* Subtle top gradient line */}
        <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', cfg.gradientLine)} />

        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
              }}
              className={cn(
                'w-full px-4 py-3.5 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent',
                fieldErrors.email ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
              )}
              placeholder="name@example.com"
              disabled={isLoading}
            />
            {fieldErrors.email && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-500" />{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={cn(
                  'w-full px-4 py-3.5 pr-12 rounded-xl border bg-white/80 dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:border-gray-400 dark:hover:border-white/20 focus:bg-white dark:focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:border-transparent',
                  fieldErrors.password ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 dark:border-white/[0.1] focus:ring-primary-500'
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
            {fieldErrors.password && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-500" />{fieldErrors.password}</p>}
          </div>

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group" onClick={() => !isLoading && setFormData({ ...formData, rememberMe: !formData.rememberMe })}>
              <div
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                  formData.rememberMe
                    ? 'bg-primary-500 border-primary-500 shadow-sm shadow-primary-500/30'
                    : 'border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 group-hover:border-primary-400'
                )}
              >
                {formData.rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="ml-2.5 text-sm text-gray-600 dark:text-gray-400 select-none group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                {t('login.rememberMe')}
              </span>
            </label>

            <Link
              href={`/auth/forgot-password?role=${role}`}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-medium transition-all"
            >
              {t('login.forgotPassword')}
            </Link>
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
                {t('login.submitting')}
              </span>
            ) : t('login.submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/60 dark:border-white/[0.06]" /></div>
        </div>

        {/* Links */}
        <div className="text-center pt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('login.noAccount')}{' '}
            <Link
              href={`/auth/register?role=${role}`}
              className="text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-semibold transition-all"
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
