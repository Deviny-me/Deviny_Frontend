'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { Heart, MessageCircle, Repeat2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'
import { usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { PostType } from '@/types/post'

interface PostActionsProps {
  postId: string
  onCommentClick?: () => void
  onRepostSuccess?: () => void
  className?: string
}

/**
 * Social interaction actions for a post (like, comment, repost).
 * Reads all data from PostStore; optimistic updates dispatched to store
 * so every visible instance of this post updates immediately.
 */
export function PostActions({
  postId,
  onCommentClick,
  onRepostSuccess,
  className,
}: PostActionsProps) {
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isRepostLoading, setIsRepostLoading] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const isLiked = post?.isLikedByMe ?? false
  const likeCount = post?.likeCount ?? 0
  const commentCount = post?.commentCount ?? 0
  const isReposted = post?.isRepostedByMe ?? false
  const repostCount = post?.repostCount ?? 0
  const isRepostPost = post?.type === PostType.Repost || post?.isRepost || !!post?.originalPostId
  const canToggleRepost = isReposted || !isRepostPost

  const handleLikeClick = useCallback(async () => {
    if (isLikeLoading || !post) return

    const wasLiked = isLiked
    const prevCount = likeCount

    // Optimistic update via store
    dispatch({
      type: 'UPDATE_POST',
      postId,
      partial: {
        isLikedByMe: !wasLiked,
        likeCount: wasLiked ? prevCount - 1 : prevCount + 1,
      },
    })
    setIsLikeLoading(true)

    try {
      const stats = wasLiked
        ? await postsApi.unlikePost(postId)
        : await postsApi.likePost(postId)

      // Reconcile with server
      if (isMountedRef.current) {
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: {
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            repostCount: stats.repostCount,
            isLikedByMe: stats.isLikedByMe,
            isRepostedByMe: stats.isRepostedByMe,
          },
        })
      }
    } catch (error) {
      // Revert
      if (isMountedRef.current) {
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: { isLikedByMe: wasLiked, likeCount: prevCount },
        })
      }
      console.error('Failed to update like:', error)
    } finally {
      if (isMountedRef.current) setIsLikeLoading(false)
    }
  }, [postId, post, isLiked, likeCount, isLikeLoading, dispatch])

  const handleRepostClick = useCallback(async () => {
    if (isRepostLoading || !post || !canToggleRepost) return

    const wasReposted = isReposted
    const prevCount = repostCount

    // Optimistic update via store
    dispatch({
      type: 'UPDATE_POST',
      postId,
      partial: {
        isRepostedByMe: !wasReposted,
        repostCount: wasReposted ? prevCount - 1 : prevCount + 1,
      },
    })
    setIsRepostLoading(true)

    try {
      if (wasReposted) {
        const stats = await postsApi.removeRepost(post.originalPostId ?? postId)
        if (isMountedRef.current) {
          dispatch({
            type: 'UPDATE_POST',
            postId,
            partial: {
              likeCount: stats.likeCount,
              commentCount: stats.commentCount,
              repostCount: stats.repostCount,
              isLikedByMe: stats.isLikedByMe,
              isRepostedByMe: stats.isRepostedByMe,
            },
          })
        }
      } else {
        const newRepost = await postsApi.repost(post.originalPostId ?? postId)
        if (isMountedRef.current) {
          // Add the new repost to the store so it appears in feeds
          dispatch({ type: 'UPSERT_POSTS', posts: [newRepost] })
          // Reconcile original post stats
          dispatch({
            type: 'UPDATE_POST',
            postId,
            partial: {
              isRepostedByMe: true,
              repostCount: (post.repostCount ?? 0) + 1,
            },
          })
        }
      }
      if (isMountedRef.current) {
        onRepostSuccess?.()
      }
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: { isRepostedByMe: wasReposted, repostCount: prevCount },
        })
      }
      console.error('Failed to update repost:', error)
    } finally {
      if (isMountedRef.current) setIsRepostLoading(false)
    }
  }, [postId, post, isReposted, repostCount, isRepostLoading, dispatch, onRepostSuccess, canToggleRepost])

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (!post) return null

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Like Button */}
      <button
        onClick={handleLikeClick}
        disabled={isLikeLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all group',
          isLiked ? 'text-red-500 bg-red-500/[0.06]' : 'text-faint-foreground hover:text-red-500 hover:bg-red-500/[0.04]'
        )}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
      >
        <Heart
          className={cn(
            'w-[18px] h-[18px] transition-transform group-hover:scale-110 group-active:scale-95',
            isLiked && 'fill-current'
          )}
        />
        {likeCount > 0 && (
          <span className="text-[13px] font-medium">{formatCount(likeCount)}</span>
        )}
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-faint-foreground hover:text-blue-500 hover:bg-blue-500/[0.04] transition-all group"
        aria-label="View comments"
      >
        <MessageCircle className="w-[18px] h-[18px] transition-transform group-hover:scale-110 group-active:scale-95" />
        {commentCount > 0 && (
          <span className="text-[13px] font-medium">{formatCount(commentCount)}</span>
        )}
      </button>

      {/* Repost Button */}
      <button
        onClick={handleRepostClick}
        disabled={isRepostLoading || !canToggleRepost}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all group cursor-pointer',
          isReposted ? 'text-green-500 bg-green-500/[0.06]' : 'text-faint-foreground hover:text-green-500 hover:bg-green-500/[0.04]',
          (isRepostLoading || !canToggleRepost) && 'opacity-70 pointer-events-none'
        )}
        aria-label={isReposted ? 'Remove repost' : 'Repost'}
        title={!canToggleRepost ? 'Нельзя репостить репост' : undefined}
      >
        <Repeat2
          className={cn(
            'w-[18px] h-[18px] transition-transform group-hover:scale-110 group-active:scale-95',
            isReposted && 'stroke-[2.5]'
          )}
        />
        {repostCount > 0 && (
          <span className="text-[13px] font-medium">{formatCount(repostCount)}</span>
        )}
      </button>
    </div>
  )
}
