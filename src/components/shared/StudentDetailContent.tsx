'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  Star,
  CheckCircle2,
  Loader2,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  Utensils,
  Dumbbell,
} from 'lucide-react'
import { getMediaUrl } from '@/lib/config'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import type { StudentDetailDto, StudentPurchase, StudentReview, SubmitReviewRequest } from '@/types/studentReview'

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  accentColor,
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
  accentColor: string
}) {
  const [hovered, setHovered] = useState(0)
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={readOnly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110 active:scale-95'}
            aria-label={`${star} звезда`}
          >
            <Star
              className={`${dim} transition-colors`}
              style={{ color: filled ? accentColor : '#6b7280', fill: filled ? accentColor : 'transparent' }}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Purchase Card with inline review form ────────────────────────────────────

function PurchaseReviewCard({
  purchase,
  accent,
  onSubmit,
}: {
  purchase: StudentPurchase
  accent: { primary: string; secondary: string }
  onSubmit: (data: SubmitReviewRequest) => Promise<StudentReview>
}) {
  const [savedReview, setSavedReview] = useState<StudentReview | null>(purchase.review)
  const [isEditing, setIsEditing] = useState(purchase.review === null)
  const [rating, setRating] = useState(purchase.review?.rating ?? 0)
  const [comment, setComment] = useState(purchase.review?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const result = await onSubmit({
        programId: purchase.programId,
        programType: purchase.programType,
        rating,
        comment: comment.trim() || null,
      })
      setSavedReview(result)
      setIsEditing(false)
    } catch {
      setSaveError('Не удалось сохранить оценку. Попробуйте снова.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setRating(savedReview?.rating ?? 0)
    setComment(savedReview?.comment ?? '')
    setSaveError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setRating(savedReview?.rating ?? 0)
    setComment(savedReview?.comment ?? '')
    setSaveError(null)
    setIsEditing(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const isTraining = purchase.programType === 'training'

  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden">
      {/* Program header */}
      <div className="p-4 sm:p-5 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
        >
          {isTraining ? (
            <Dumbbell className="w-5 h-5" style={{ color: accent.primary }} />
          ) : (
            <Utensils className="w-5 h-5" style={{ color: accent.primary }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{purchase.programTitle}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${accent.primary}1a`, color: accent.primary }}
            >
              {isTraining ? 'Тренировки' : 'Питание'}
            </span>
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                purchase.status === 'active'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-gray-500/15 text-gray-400'
              }`}
            >
              {purchase.status === 'active' ? 'Активна' : 'Завершена'}
            </span>
            <span className="text-xs text-faint-foreground">
              куплено {formatDate(purchase.purchasedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Review section */}
      <div className="border-t border-border-subtle px-4 sm:px-5 py-4 bg-surface-2/40">
        <p className="text-[11px] font-semibold text-faint-foreground uppercase tracking-wider mb-3">
          Оценка тренера
        </p>

        {/* Saved review display */}
        {!isEditing && savedReview && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <StarRating value={savedReview.rating} readOnly accentColor={accent.primary} />
              <span className="text-sm font-bold text-foreground">{savedReview.rating}/5</span>
            </div>
            {savedReview.comment && (
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                &ldquo;{savedReview.comment}&rdquo;
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-faint-foreground">{formatDate(savedReview.updatedAt)}</span>
              <button
                type="button"
                onClick={handleEdit}
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: accent.primary }}
              >
                Редактировать
              </button>
            </div>
          </div>
        )}

        {/* Review form */}
        {isEditing && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {savedReview ? 'Изменить оценку:' : 'Оцените студента по этой программе:'}
              </p>
              <StarRating value={rating} onChange={setRating} accentColor={accent.primary} />
              {rating === 0 && (
                <p className="text-xs text-faint-foreground mt-1">Нажмите на звезду чтобы выбрать</p>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)..."
              rows={2}
              maxLength={500}
              className="w-full rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-3 py-2 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 resize-none transition-all"
              style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
            />
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || saving}
                className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: rating > 0 ? accent.primary : `${accent.primary}30`,
                  color: rating > 0 ? '#ffffff' : accent.primary,
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saving ? 'Сохраняем...' : savedReview ? 'Обновить оценку' : 'Сохранить оценку'}
              </button>
              {savedReview && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-9 px-4 rounded-xl text-sm font-medium bg-surface-1 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface StudentDetailContentProps {
  studentId: string
  role: 'trainer' | 'nutritionist'
  fetchDetail: (id: string) => Promise<StudentDetailDto>
  submitReview: (id: string, data: SubmitReviewRequest) => Promise<StudentReview>
  backPath: string
  basePath: string
}

export function StudentDetailContent({
  studentId,
  role,
  fetchDetail,
  submitReview,
  backPath,
  basePath,
}: StudentDetailContentProps) {
  const router = useRouter()
  const accent = getAccentColorsByRole(role)

  const [detail, setDetail] = useState<StudentDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchDetail(studentId)
        if (!cancelled) setDetail(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [studentId, fetchDetail])

  const handleSubmitReview = useCallback(
    async (purchaseId: string, data: SubmitReviewRequest): Promise<StudentReview> => {
      const result = await submitReview(studentId, data)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              purchases: prev.purchases.map((p) =>
                p.purchaseId === purchaseId ? { ...p, review: result } : p
              ),
            }
          : prev
      )
      return result
    },
    [studentId, submitReview]
  )

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const label = role === 'trainer' ? 'ученика' : 'клиента'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 pb-24 lg:pb-8">
        <button
          type="button"
          onClick={() => router.push(backPath)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-10 text-center">
          <p className="text-muted-foreground">{error || `Карточка ${label} не найдена`}</p>
        </div>
      </div>
    )
  }

  const name = detail.fullName || `${detail.firstName} ${detail.lastName}`.trim()
  const locationParts = [detail.city, detail.country].filter(Boolean)

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push(backPath)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Profile card */}
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {detail.avatarUrl ? (
              <img
                src={getMediaUrl(detail.avatarUrl) || ''}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-background"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl ring-2 ring-background"
                style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
              >
                {getInitials(name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{name}</h1>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{detail.email}</span>
              </div>
              {detail.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{detail.phone}</span>
                </div>
              )}
              {locationParts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{locationParts.join(', ')}</span>
                </div>
              )}
            </div>
            {detail.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border-subtle pt-3">
                {detail.bio}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-row sm:flex-col gap-2 sm:w-36">
            <button
              type="button"
              onClick={() => router.push(`${basePath}/messages?userId=${detail.id}`)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold ring-1 ring-inset hover:brightness-110 active:scale-[0.99] transition-all"
              style={{
                color: accent.primary,
                backgroundColor: `${accent.primary}1a`,
                ['--tw-ring-color' as never]: `${accent.primary}55`,
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Написать
            </button>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/profile/${detail.id}`)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Профиль
            </button>
          </div>
        </div>
      </div>

      {/* Medical warning */}
      {detail.hasInjuries && (
        <div className="rounded-2xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">Есть медицинские ограничения</p>
            <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">
              Студент указал наличие травм или медицинских ограничений. Учитывайте это при составлении программы.
            </p>
            {detail.injuryDocUrl && (
              <a
                href={detail.injuryDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors underline-offset-2 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Просмотреть документ
              </a>
            )}
          </div>
        </div>
      )}

      {/* Purchases + Reviews */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <BookOpen className="w-5 h-5" style={{ color: accent.primary }} />
          <h2 className="text-base font-semibold text-foreground">Купленные программы</h2>
          {detail.purchases.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${accent.primary}1a`, color: accent.primary }}
            >
              {detail.purchases.length}
            </span>
          )}
        </div>

        {detail.purchases.length === 0 ? (
          <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-10 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-faint-foreground" />
            <p className="text-sm text-muted-foreground">Нет купленных программ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {detail.purchases.map((purchase) => (
              <PurchaseReviewCard
                key={purchase.purchaseId}
                purchase={purchase}
                accent={accent}
                onSubmit={(data) => handleSubmitReview(purchase.purchaseId, data)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
