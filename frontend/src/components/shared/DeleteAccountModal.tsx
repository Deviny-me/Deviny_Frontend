'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { deleteAccount } from '@/lib/api/userApi'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteAccountModal({ isOpen, onClose, onSuccess }: DeleteAccountModalProps) {
  const t = useTranslations('settings')
  const tc = useTranslations('common')

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    if (loading) return
    setPassword('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError(null)

    try {
      await deleteAccount(password)
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      // Показываем "неверный пароль" только если бэкенд явно сообщил об этом
      if (
        message.includes('Неверный пароль') ||
        message.toLowerCase().includes('wrong password') ||
        message.toLowerCase().includes('incorrect password')
      ) {
        setError(t('wrongPassword'))
      } else {
        setError(t('deleteAccountError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md bg-surface-3 border border-border rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{t('deleteAccount')}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('deleteConfirmation')}
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('deleteAccountPasswordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setError(null); setPassword(e.target.value) }}
              placeholder={t('deleteAccountPasswordPlaceholder')}
              disabled={loading}
              autoFocus
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 disabled:opacity-60 transition-colors"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-border text-sm font-medium text-foreground rounded-lg hover:bg-hover-overlay transition-colors disabled:opacity-50"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('deleteAccountConfirmButton')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
