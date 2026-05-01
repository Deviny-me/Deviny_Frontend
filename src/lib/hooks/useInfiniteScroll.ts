'use client'

import { RefObject, useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  enabled: boolean
  onLoadMore: () => void
  rootMargin?: string
  threshold?: number
}

export function useInfiniteScroll({
  enabled,
  onLoadMore,
  rootMargin = '600px 0px',
  threshold = 0,
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement> {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!enabled || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, onLoadMore, rootMargin, threshold])

  return sentinelRef
}
