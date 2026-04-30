'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Repeat2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'
import { getMediaUrl } from '@/lib/config'
import { PostDto, PostType } from '@/types/post'
import { getRoleRingClass } from '@/lib/theme/useAccentColors'

interface RepostDialogProps {
  post: PostDto
  isOpen: boolean
  onClose: () => void
  onSuccess?: (repost: PostDto) => void
}

/**
 * Dialog for reposting a post with an optional quote.
 */
export function RepostDialog({
  post,
  isOpen,
  onClose,
  onSuccess,
}: RepostDialogProps) {
  const [quote, setQuote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuote('')
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const repost = await postsApi.repost(post.id, {
        quote: quote.trim() || undefined,
      })
      onSuccess?.(repost)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to repost')
    } finally {
      setIsSubmitting(false)
    }
  }, [post.id, quote, isSubmitting, onSuccess, onClose])

  if (!isOpen) return null

  const author = post.author
  const displayName = author 
    ? `${author.firstName} ${author.lastName}`
    : 'Unknown'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repost-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 id="repost-dialog-title" className="text-lg font-semibold text-gray-900">
            Repost
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-faint-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quote Input */}
          <div>
            <textarea
              ref={textareaRef}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Add your thoughts (optional)..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {quote.length}/500
            </p>
          </div>

          {/* Original Post Preview */}
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              {author?.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={displayName}
                  className={`w-6 h-6 rounded-full object-cover ${getRoleRingClass(author?.role)}`}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {author?.firstName?.[0] || '?'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {displayName}
              </span>
            </div>
            
            {post.caption && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {post.caption}
              </p>
            )}

            {/* Media Preview */}
            {post.media && post.media.length > 0 && (
              <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                {post.type === PostType.Video ? (
                  <video
                    src={getMediaUrl(post.media[0].url) || ''}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={getMediaUrl(post.media[0].thumbnailUrl || post.media[0].url) || ''}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                )}
                {post.media.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-foreground text-xs px-2 py-1 rounded">
                    +{post.media.length - 1}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2',
              isSubmitting
                ? 'bg-gray-100 text-muted-foreground cursor-not-allowed'
                : 'bg-green-500 text-foreground hover:bg-green-600'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reposting...
              </>
            ) : (
              <>
                <Repeat2 className="w-4 h-4" />
                Repost
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
