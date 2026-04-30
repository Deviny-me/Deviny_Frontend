'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Star, Loader2, MessageSquare, ExternalLink } from 'lucide-react'
import { reviewsApi } from '@/lib/api/reviewsApi'
import { ExpertReviewDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import Link from 'next/link'

interface ProfileReviewsTabProps {
  expertId: string
  accentText: string
  accentGradient: string
}

export function ProfileReviewsTab({ expertId, accentText, accentGradient }: ProfileReviewsTabProps) {
  const t = useTranslations('profile')
  const [reviews, setReviews] = useState<ExpertReviewDto[]>([])
  const [loading, setLoading] = useState(true)

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true)
      const data = await reviewsApi.getExpertReviews(expertId)
      setReviews(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [expertId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`w-8 h-8 animate-spin ${accentText}`} />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-muted-foreground">{t('noReviewsYet')}</p>
        <p className="text-sm text-faint-foreground mt-1">{t('reviewsWillAppear')}</p>
      </div>
    )
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`bg-gradient-to-br ${accentGradient.replace('from-', 'from-').replace('to-', 'to-')} rounded-xl border border-border-subtle p-5 flex items-center gap-6`}
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))` }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
              />
            ))}
          </div>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div>
          <p className="text-foreground font-medium">{reviews.length} {t('reviewsTotal')}</p>
          <p className="text-sm text-muted-foreground">{t('acrossAllPrograms')}</p>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="bg-surface-2 rounded-xl border border-border-subtle p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {review.userAvatarUrl ? (
                <img
                  src={review.userAvatarUrl.startsWith('http') ? review.userAvatarUrl : getMediaUrl(review.userAvatarUrl) || ''}
                  alt={review.userName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {review.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Header: name + rating */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">{review.userName}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Program link */}
                <Link
                  href={`/user/programs/${review.programId}?category=${review.programType === 'training' ? 'Training' : 'Diet'}`}
                  className={`inline-flex items-center gap-1 text-xs ${accentText} hover:underline mt-0.5`}
                >
                  {review.programTitle}
                  <ExternalLink className="w-3 h-3" />
                </Link>

                {/* Comment */}
                {review.comment && (
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{review.comment}</p>
                )}

                {/* Date */}
                <p className="text-xs text-faint-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
