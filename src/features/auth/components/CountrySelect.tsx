'use client'

import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'

import { cn } from '@/lib/utils/cn'

export interface CountrySelectOption {
  value: string
  label: string
  countryCode: string
  meta?: string
  keywords?: string[]
}

interface CountrySelectProps {
  value: string
  options: CountrySelectOption[]
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  className?: string
  panelClassName?: string
  compact?: boolean
  showSelectedMeta?: boolean
  renderValue?: (option: CountrySelectOption | undefined) => string
}

function normalizeValue(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

function FlagBadge({ countryCode, compact = false }: { countryCode?: string; compact?: boolean }) {
  if (!countryCode) {
    return (
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 dark:border-white/10 dark:text-gray-500', compact && 'h-9 w-9 rounded-lg')}>
        --
      </span>
    )
  }

  return (
    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.03]', compact && 'h-9 w-9 rounded-lg')}>
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{ width: compact ? '1.2rem' : '1.35rem', height: compact ? '1.2rem' : '1.35rem' }}
        aria-label={countryCode}
      />
    </span>
  )
}

export function CountrySelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  className,
  panelClassName,
  compact = false,
  showSelectedMeta = true,
  renderValue,
}: CountrySelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = options.find(option => option.value === value)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeValue(query.trim())
    if (!normalizedQuery) return options

    return options.filter(option => {
      const haystack = [option.label, option.meta, option.value, ...(option.keywords || [])]
        .filter(Boolean)
        .join(' ')

      return normalizeValue(haystack).includes(normalizedQuery)
    })
  }, [options, query])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      return
    }

    inputRef.current?.focus()

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const buttonLabel = renderValue?.(selectedOption) ?? selectedOption?.label ?? placeholder

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(open => !open)}
        className={cn(
          'group w-full rounded-2xl border bg-white/85 text-left text-gray-900 transition-all duration-200 hover:border-gray-400 hover:shadow-lg hover:shadow-black/[0.04] focus:outline-none focus:ring-2 focus:ring-primary-500/80 dark:bg-[#171717] dark:text-white dark:hover:border-white/20',
          compact ? 'h-[54px] px-3 py-0' : 'h-[54px] px-4 py-0',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <span className="flex items-center gap-3">
          <FlagBadge countryCode={selectedOption?.countryCode} compact={compact} />
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate font-semibold', !selectedOption && 'text-gray-400 dark:text-gray-500')}>
              {buttonLabel}
            </span>
            {selectedOption?.meta && !compact && showSelectedMeta && (
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{selectedOption.meta}</span>
            )}
          </span>
          <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
        </span>
      </button>

      {isOpen && (
        <div className={cn('absolute left-0 z-40 mt-2 overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#111111]/95', compact ? 'w-[24rem] max-w-[calc(100vw-2rem)]' : 'w-full max-w-[calc(100vw-2rem)]', panelClassName)}>
          <div className="border-b border-gray-100/80 p-3 dark:border-white/10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className={cn('w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white', compact ? 'py-2.5' : 'py-3')}
              />
            </div>
          </div>

          <div className={cn('overflow-y-auto p-2', compact ? 'max-h-64' : 'max-h-72')}>
            {filteredOptions.length === 0 ? (
              <div className="rounded-2xl px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    compact ? 'flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-left transition-all duration-150 hover:bg-gray-100/80 dark:hover:bg-white/[0.05]' : 'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-150 hover:bg-gray-100/80 dark:hover:bg-white/[0.05]',
                    option.value === value && 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                  )}
                >
                  <FlagBadge countryCode={option.countryCode} compact />
                  <span className="min-w-0 flex-1">
                    {compact ? (
                      <span className="flex items-baseline gap-2 overflow-hidden whitespace-nowrap">
                        <span className="shrink-0 font-semibold">{option.label}</span>
                        {option.meta && <span className="truncate text-xs text-gray-500 dark:text-gray-400">{option.meta}</span>}
                      </span>
                    ) : (
                      <>
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.meta && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{option.meta}</span>}
                      </>
                    )}
                  </span>
                  {option.value === value && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}