'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { Sun, Moon } from 'lucide-react'

function FloatingShape({ className }: { className?: string }) {
  return (
    <div
      className={`absolute pointer-events-none rounded-full opacity-20 dark:opacity-10 ${className}`}
    />
  )
}

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        if (!isExpired) {
          const role = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          if (role === 'Trainer' || role === '1') {
            window.location.replace('/trainer')
            return
          } else if (role === 'Nutritionist' || role === '3') {
            window.location.replace('/nutritionist')
            return
          } else {
            window.location.replace('/user')
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-white via-[#fefcf6] to-[#faf3e0] dark:from-[#0A0A0A] dark:via-[#111111] dark:to-[#0A0A0A]">

      {/* Animated background shapes */}
      <FloatingShape className="w-72 h-72 bg-primary-300 dark:bg-primary-600 blur-3xl animate-float top-[10%] right-[5%]" />
      <FloatingShape className="w-96 h-96 bg-user-300 dark:bg-user-700 blur-3xl animate-float-delayed bottom-[10%] left-[10%]" />
      <FloatingShape className="w-64 h-64 bg-trainer-300 dark:bg-trainer-700 blur-3xl animate-float-slow top-[50%] right-[30%]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
        <Image src={isDark ? '/logo-white.png' : '/logo.png'} alt="Deviny" width={110} height={36} className="w-[90px] sm:w-[110px] h-auto" priority />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Form area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 pb-8">
        {authChecked ? children : null}
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-600">© {new Date().getFullYear()} Deviny</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-600">
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">About</a>
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>
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
