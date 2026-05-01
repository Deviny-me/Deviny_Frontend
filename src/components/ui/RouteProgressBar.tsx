'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/** Call this before router.push() to show the route progress bar */
export function startNavigation() {
  window.dispatchEvent(new Event('routeChangeStart'))
}

export function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevUrl = useRef('')

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setProgress(0)
    setVisible(true)
    setTimeout(() => setProgress(30), 50)
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + (90 - prev) * 0.1
      })
    }, 300)
    // Auto-cancel if no navigation happens within 8s
    timeoutRef.current = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      setTimeout(() => { setVisible(false); setProgress(0) }, 300)
    }, 8000)
  }, [])

  const done = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setProgress(100)
    setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)
  }, [])

  useEffect(() => {
    const url = pathname + searchParams.toString()
    if (prevUrl.current && prevUrl.current !== url) {
      done()
    }
    prevUrl.current = url
  }, [pathname, searchParams, done])

  // Listen for custom navigation start event (from router.push calls)
  useEffect(() => {
    const handleRouteStart = () => start()
    window.addEventListener('routeChangeStart', handleRouteStart)
    return () => window.removeEventListener('routeChangeStart', handleRouteStart)
  }, [start])

  // Intercept link clicks for navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (target.getAttribute('target') === '_blank') return
      const current = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
      if (href !== current) {
        start()
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, searchParams, start])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-white/80 via-white to-white/80 shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
