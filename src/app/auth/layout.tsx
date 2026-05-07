'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { Sun, Moon } from 'lucide-react'

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Redirect authenticated users to their dashboard.
    // Preserve query string (e.g. ?lang=ru from landing) + hash.
    const search = window.location.search
    const hash = window.location.hash
    const go = (path: string) => window.location.replace(`${path}${search}${hash}`)

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        if (!isExpired) {
          const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          if (role === 'Trainer' || role === '1') {
            go('/trainer')
            return
          } else if (role === 'Nutritionist' || role === '3') {
            go('/nutritionist')
            return
          } else {
            go('/user')
            return
          }
        }
      } catch { /* malformed token — let them stay on auth */ }
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const dark = stored === 'dark'
    setIsDark(dark)
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <div className="relative isolate min-h-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* ─── Backdrop ─── */}
      {/* Layer 1: rich multi-stop aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30
          [background:radial-gradient(48rem_36rem_at_88%_-10%,rgba(212,168,67,0.20),transparent_55%),radial-gradient(42rem_32rem_at_-10%_8%,rgba(12,141,230,0.16),transparent_60%),radial-gradient(44rem_34rem_at_115%_92%,rgba(240,121,21,0.13),transparent_60%),radial-gradient(50rem_38rem_at_-12%_108%,rgba(40,191,104,0.11),transparent_60%)]
          dark:[background:radial-gradient(52rem_38rem_at_88%_-10%,rgba(212,168,67,0.18),transparent_55%),radial-gradient(44rem_34rem_at_-10%_8%,rgba(12,141,230,0.16),transparent_60%),radial-gradient(46rem_36rem_at_115%_92%,rgba(240,121,21,0.12),transparent_60%),radial-gradient(52rem_40rem_at_-12%_108%,rgba(40,191,104,0.12),transparent_60%)]"
      />
      {/* Layer 2: subtle dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.5] dark:opacity-[0.35]
          [background-image:radial-gradient(circle_at_1px_1px,rgba(9,9,11,0.07)_1px,transparent_0)]
          dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]
          [background-size:22px_22px]
          [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
      />
      {/* Layer 3: top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px -z-10 bg-gradient-to-r from-transparent via-primary-500/40 to-transparent"
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
        <Image
          src={isDark ? '/logo-white.png' : '/logo.png'}
          alt="Deviny"
          width={110}
          height={36}
          className="w-[90px] sm:w-[110px] h-auto"
          priority
        />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-hover-overlay transition-[background-color,color] duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Form area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 pb-8">
        {authChecked ? children : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-[11px] sm:text-xs text-faint-foreground tabular-nums">© {new Date().getFullYear()} Deviny</p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] sm:text-xs text-faint-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </LanguageProvider>
  )
}
