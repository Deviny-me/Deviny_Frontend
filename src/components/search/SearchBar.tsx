'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, Loader2, User, Dumbbell, UtensilsCrossed } from 'lucide-react'
import { searchGlobal } from '@/lib/api/searchApi'
import { GlobalSearchResponse, UserSearchItem, ProgramSearchItem } from '@/types/search'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'

interface SearchBarProps {
  placeholder?: string
  mobileModal?: boolean
}

function useSearchBase() {
  const router = useRouter()
  const pathname = usePathname()
  const tSearch = useTranslations('search')
  const accent = useAccentColors()

  const basePath = pathname?.startsWith('/trainer')
    ? '/trainer'
    : pathname?.startsWith('/nutritionist')
      ? '/nutritionist'
      : '/user'

  const renderResults = (
    results: GlobalSearchResponse | null,
    onUserClick: (item: UserSearchItem) => void,
    onProgramClick: (item: ProgramSearchItem) => void,
  ) => {
    if (!results) return null

    return (
      <>
        {results.users.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint-foreground" style={{ background: 'var(--section-header-bg)' }}>
              <User className="mr-1.5 inline h-3.5 w-3.5 -mt-0.5" />
              {tSearch('users')}
            </div>
            {results.users.map((item) => (
              <button
                key={item.id}
                onClick={() => onUserClick(item)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover-overlay"
              >
                {item.avatarUrl ? (
                  <img
                    src={getMediaUrl(item.avatarUrl) || ''}
                    alt={item.fullName}
                    className={`h-8 w-8 flex-shrink-0 rounded-full object-cover ${getRoleRingClass(item.role)}`}
                  />
                ) : (
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAccentColorsByRole(item.role).gradient}`}>
                    <span className="text-xs font-bold text-white">
                      {item.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.role === 'Trainer' ? tSearch('trainer') : item.role === 'Nutritionist' ? tSearch('nutritionist') : tSearch('user')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results.workoutPrograms.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint-foreground" style={{ background: 'var(--section-header-bg)' }}>
              <Dumbbell className="mr-1.5 inline h-3.5 w-3.5 -mt-0.5" />
              {tSearch('trainingPrograms')}
            </div>
            {results.workoutPrograms.map((item) => (
              <button
                key={item.id}
                onClick={() => onProgramClick(item)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover-overlay"
              >
                {item.coverImagePath ? (
                  <img
                    src={getMediaUrl(item.coverImagePath) || ''}
                    alt={item.title}
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded ${accent.bgMuted20}`}>
                    <Dumbbell className={`h-4 w-4 ${accent.text}`} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.code} · ${item.price} · {item.trainerName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results.mealPrograms.length > 0 && (
          <div>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint-foreground" style={{ background: 'var(--section-header-bg)' }}>
              <UtensilsCrossed className="mr-1.5 inline h-3.5 w-3.5 -mt-0.5" />
              {tSearch('nutritionPrograms')}
            </div>
            {results.mealPrograms.map((item) => (
              <button
                key={item.id}
                onClick={() => onProgramClick(item)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover-overlay"
              >
                {item.coverImagePath ? (
                  <img
                    src={getMediaUrl(item.coverImagePath) || ''}
                    alt={item.title}
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-green-500/20">
                    <UtensilsCrossed className="h-4 w-4 text-green-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.code} · ${item.price} · {item.trainerName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  return {
    accent,
    basePath,
    tSearch,
    router,
    renderResults,
  }
}

function DesktopSearchBar({ placeholder, autoFocus = false }: { placeholder: string; autoFocus?: boolean }) {
  const { accent, basePath, tSearch, router, renderResults } = useSearchBase()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (value: string) => {
    if (abortRef.current) abortRef.current.abort()
    if (value.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      setIsOpen(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)

    try {
      const data = await searchGlobal(value.trim(), 5, controller.signal)
      setResults(data)
      setIsOpen(true)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Search error:', err)
      setResults(null)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults(null)
      setIsOpen(false)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    debounceRef.current = setTimeout(() => runSearch(value), 350)
  }

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clear = () => {
    setQuery('')
    setResults(null)
    setIsOpen(false)
    setIsLoading(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [close])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasResults = results && (results.users.length > 0 || results.workoutPrograms.length > 0 || results.mealPrograms.length > 0)
  const noResults = results && !hasResults && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0 max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (results) setIsOpen(true) }}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-lg border border-[rgba(148,163,184,0.18)] bg-border-subtle py-1.5 pl-10 pr-8 text-sm text-foreground placeholder-gray-500 transition-all focus:border-[rgba(148,163,184,0.28)] focus:bg-border-subtle focus:outline-none"
      />
      {(isLoading || query) && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button onClick={clear} className="text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )}
      {isOpen && (hasResults || noResults) && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[min(70vh,400px)] overflow-y-auto rounded-xl border border-border bg-surface-2" style={{ boxShadow: 'var(--dropdown-shadow)' }}>
          {noResults ? (
            <div className="px-4 py-6 text-center text-sm text-faint-foreground">
              {tSearch('noResults', { query: query.trim() })}
            </div>
          ) : (
            renderResults(
              results,
              (item) => {
                setQuery('')
                setIsOpen(false)
                router.push(`${basePath}/profile/${item.slug || item.id}`)
              },
              (item) => {
                setQuery('')
                setIsOpen(false)
                router.push(`${basePath}/programs?program=${item.id}`)
              },
            )
          )}
        </div>
      )}
    </div>
  )
}

function MobileSearchModal({ placeholder }: { placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [close])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all hover:bg-hover-overlay hover:text-foreground md:hidden"
        title={placeholder}
      >
        <Search className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm md:hidden" onClick={close}>
          <div className="flex h-full flex-col bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border-subtle bg-surface-2 px-4 pb-4 pt-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{placeholder}</p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="w-full">
                <DesktopSearchBar placeholder={placeholder} autoFocus />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SearchBar({ placeholder = 'Поиск...', mobileModal = false }: SearchBarProps) {
  const tSearch = useTranslations('search')
  const resolvedPlaceholder = placeholder || tSearch('placeholder')

  if (mobileModal) {
    return <MobileSearchModal placeholder={resolvedPlaceholder} />
  }

  return <DesktopSearchBar placeholder={resolvedPlaceholder} />
}
