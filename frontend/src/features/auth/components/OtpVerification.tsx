'use client'

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils/cn'
import { Mail, RefreshCw, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'

interface OtpVerificationProps {
  email: string
  onVerified: (otpCode?: string) => void
  onBack?: () => void
  onResend?: () => Promise<void>
  variant?: 'user' | 'trainer' | 'nutritionist'
  role?: 'user' | 'trainer' | 'nutritionist'
  purpose?: 'registration' | 'password_reset'
}

const variantConfig = {
  user: {
    buttonVariant: 'user' as const,
    accentColor: 'text-user-600 dark:text-user-400',
    bgGradient: 'from-user-400 via-user-500 to-user-600',
  },
  trainer: {
    buttonVariant: 'trainer' as const,
    accentColor: 'text-trainer-600 dark:text-trainer-400',
    bgGradient: 'from-trainer-400 via-trainer-500 to-trainer-600',
  },
  nutritionist: {
    buttonVariant: 'nutritionist' as const,
    accentColor: 'text-nutritionist-600 dark:text-nutritionist-400',
    bgGradient: 'from-nutritionist-400 via-nutritionist-500 to-nutritionist-600',
  },
}

export function OtpVerification({ 
  email, 
  onVerified, 
  onBack, 
  onResend,
  variant,
  role = 'user',
  purpose = 'registration'
}: OtpVerificationProps) {
  const t = useTranslations('auth.otp')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Support both variant and role props for backwards compatibility
  const effectiveVariant = variant || role
  const config = variantConfig[effectiveVariant]

  // Start resend cooldown on mount
  useEffect(() => {
    setResendCooldown(60)
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    setError(null)

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all digits entered
    if (digit && index === 5 && newOtp.every(d => d)) {
      verifyOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      verifyOtp(pastedData)
    }
  }

  const verifyOtp = async (code: string) => {
    setIsVerifying(true)
    setError(null)

    try {
      if (purpose === 'password_reset') {
        await authService.verifyResetOtp(email, code)
        setSuccess(true)
        setTimeout(() => onVerified(code), 500)
      } else {
        await authService.verifyOtp(email, code)
        setSuccess(true)
        setTimeout(() => onVerified(), 500)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      const errorMap: Record<string, string> = {
        'INVALID_OTP': t('errorInvalid'),
        'OTP_EXPIRED': t('errorExpired'),
        'OTP_ALREADY_USED': t('errorUsed'),
        'TOO_MANY_ATTEMPTS': t('errorTooMany'),
        'SERVER_UNAVAILABLE': t('errorServer'),
      }
      setError(errorMap[message] || message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError(null)

    try {
      if (onResend) {
        await onResend()
      } else {
        await authService.sendOtp(email)
      }
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend'
      setError(message)
    } finally {
      setIsResending(false)
    }
  }

  // Simplified version without back button and header (for embedded use)
  if (!onBack) {
    return (
      <div className="w-full">
        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200/60 dark:border-green-500/20 rounded-2xl text-green-700 dark:text-green-400 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            {t('success')}
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
          {t('subtitle', { email })}
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isVerifying || success}
              className={cn(
                'w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all',
                'bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                digit
                  ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500/20'
                  : 'border-gray-200 dark:border-white/[0.1] focus:border-primary-500 focus:ring-primary-500/20',
                (isVerifying || success) && 'opacity-50 cursor-not-allowed'
              )}
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          variant={config.buttonVariant}
          size="lg"
          fullWidth
          disabled={otp.some(d => !d) || isVerifying || success}
          onClick={() => verifyOtp(otp.join(''))}
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="white" />
              {t('verifying')}
            </span>
          ) : success ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              {t('verified')}
            </span>
          ) : (
            t('verify')
          )}
        </Button>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('didntReceive')}
          </p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium transition-all',
              resendCooldown > 0 || isResending
                ? 'text-gray-400 cursor-not-allowed'
                : cn(config.accentColor, 'hover:underline')
            )}
          >
            {isResending ? (
              <>
                <Spinner size="sm" />
                {t('resending')}
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('resendIn', { seconds: resendCooldown })}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('resend')}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all group mb-8"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('back')}
      </button>

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className={cn(
          'w-18 h-18 rounded-2xl flex items-center justify-center mb-4 shadow-lg',
          'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-500/20 dark:to-primary-600/20'
        )}>
          <Mail className="w-9 h-9 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          {t('subtitle', { email })}
        </p>
      </div>

      {/* Form card */}
      <div className="relative bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-xl shadow-black/[0.04] dark:shadow-none border border-gray-200/60 dark:border-white/[0.08] p-6 sm:p-8">
        {/* Subtle top gradient line */}
        <div className={cn('absolute top-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r opacity-60', config.bgGradient)} />

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200/60 dark:border-green-500/20 rounded-2xl text-green-700 dark:text-green-400 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            {t('success')}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isVerifying || success}
              className={cn(
                'w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all',
                'bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                digit
                  ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500/20'
                  : 'border-gray-200 dark:border-white/[0.1] focus:border-primary-500 focus:ring-primary-500/20',
                (isVerifying || success) && 'opacity-50 cursor-not-allowed'
              )}
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          variant={config.buttonVariant}
          size="lg"
          fullWidth
          disabled={otp.some(d => !d) || isVerifying || success}
          onClick={() => verifyOtp(otp.join(''))}
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" color="white" />
              {t('verifying')}
            </span>
          ) : success ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              {t('verified')}
            </span>
          ) : (
            t('verify')
          )}
        </Button>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('didntReceive')}
          </p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium transition-all',
              resendCooldown > 0 || isResending
                ? 'text-gray-400 cursor-not-allowed'
                : cn(config.accentColor, 'hover:underline')
            )}
          >
            {isResending ? (
              <>
                <Spinner size="sm" />
                {t('resending')}
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('resendIn', { seconds: resendCooldown })}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('resend')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
