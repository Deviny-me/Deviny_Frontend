'use client'

import { useState, useEffect } from 'react'
import { Loader2, MessageSquare, Dumbbell, Utensils } from 'lucide-react'
import Link from 'next/link'
import { reviewsApi } from '@/lib/api/reviewsApi'
import type { TrainerReviewDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useAuth } from '@/features/auth/AuthContext'

export function UserReceivedReviewsTab({ userId }: { userId: string }) {
  const { user } = useAuth()
  const basePath = user?.role === 'trainer' ? '/trainer' : user?.role === 'nutritionist' ? '/nutritionist' : '/user'

  const [reviews, setReviews] = useState<TrainerReviewDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const data = await reviewsApi.getTrainerReviews(userId)
        if (!cancelled) setReviews(data)
      } catch {
        // silently fail — endpoint may not exist yet
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Нет отзывов от тренеров</p>
        <p className="text-sm text-faint-foreground mt-1">Отзывы появятся после прохождения программ</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 flex items-center gap-4">
        <MessageSquare className="w-8 h-8 flex-shrink-0 text-muted-foreground" />
        <div>
          <p className="text-foreground font-semibold">{reviews.length} отзывов</p>
          <p className="text-sm text-muted-foreground">от тренеров и нутрициологов</p>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const accent = review.programType === 'training' ? '#d4722a' : '#28bf68'
          return (
          <div key={review.id} className="bg-surface-2 rounded-xl border border-border-subtle p-4">
            <div className="flex items-start gap-3">
              {/* Trainer avatar */}
              {review.trainerAvatarUrl ? (
                <img
                  src={
                    review.trainerAvatarUrl.startsWith('http')
                      ? review.trainerAvatarUrl
                      : getMediaUrl(review.trainerAvatarUrl) || ''
                  }
                  alt={review.trainerName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}22` }}
                >
                  <span className="text-sm font-semibold" style={{ color: accent }}>
                    {review.trainerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Trainer name — links to their public profile */}
                <Link
                  href={`${basePath}/profile/${review.trainerId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {review.trainerName}
                </Link>

                {/* Program — links to the program detail page */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {review.programType === 'training' ? (
                    <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
                  ) : (
                    <Utensils className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
                  )}
                  <Link
                    href={`${basePath}/programs/${review.programId}?category=${review.programType === 'training' ? 'Training' : 'Diet'}`}
                    className="text-xs font-medium truncate hover:underline"
                    style={{ color: accent }}
                  >
                    {review.programTitle}
                  </Link>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{review.comment}</p>
                )}

                {/* Date */}
                <p className="text-xs text-faint-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
