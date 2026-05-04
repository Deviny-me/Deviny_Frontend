'use client'

import { ReactNode, useId, useMemo } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

type AccentRole = 'user' | 'trainer' | 'nutritionist' | 'primary' | 'neutral'
type TabsVariant = 'segmented' | 'underline' | 'pills'
type TabsSize = 'sm' | 'md'

interface TabItem<T extends string = string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

interface TabsProps<T extends string = string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  variant?: TabsVariant
  size?: TabsSize
  accent?: AccentRole
  fullWidth?: boolean
  className?: string
  ariaLabel?: string
}

const ACCENT_ACTIVE_TEXT: Record<AccentRole, string> = {
  user:         'text-user-600 dark:text-user-300',
  trainer:      'text-trainer-600 dark:text-trainer-300',
  nutritionist: 'text-nutritionist-600 dark:text-nutritionist-300',
  primary:      'text-primary-600 dark:text-primary-300',
  neutral:      'text-foreground',
}

const ACCENT_BG: Record<AccentRole, string> = {
  user:         'bg-user-500',
  trainer:      'bg-trainer-500',
  nutritionist: 'bg-nutritionist-500',
  primary:      'bg-primary-500',
  neutral:      'bg-foreground',
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'segmented',
  size = 'md',
  accent = 'neutral',
  fullWidth = false,
  className,
  ariaLabel,
}: TabsProps<T>) {
  const layoutId = useId()
  const sizing = useMemo(
    () => ({
      sm: { wrap: 'h-9', tab: 'h-7 px-3 text-xs', gap: 'gap-1' },
      md: { wrap: 'h-10', tab: 'h-8 px-3.5 text-sm', gap: 'gap-1' },
    }),
    [],
  )[size]

  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'relative flex items-end border-b border-border',
          fullWidth ? 'w-full' : 'w-fit',
          className,
        )}
      >
        <LayoutGroup id={layoutId}>
          {items.map((item) => {
            const active = item.value === value
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={item.disabled}
                onClick={() => onChange(item.value)}
                className={cn(
                  'relative inline-flex items-center gap-1.5 px-4 pb-2.5 pt-2 text-sm font-medium tracking-tight',
                  'transition-colors duration-200 ease-out-expo',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t',
                  active
                    ? ACCENT_ACTIVE_TEXT[accent]
                    : 'text-muted-foreground hover:text-foreground',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {item.icon}
                {item.label}
                {item.badge}
                {active && (
                  <motion.span
                    layoutId={`tab-underline-${layoutId}`}
                    className={cn('absolute inset-x-2 -bottom-px h-0.5 rounded-full', ACCENT_BG[accent])}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </LayoutGroup>
      </div>
    )
  }

  // segmented + pills
  const isPills = variant === 'pills'
  const wrapBase = isPills
    ? 'inline-flex items-center gap-1'
    : cn(
        'inline-flex items-center rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle p-1',
        sizing.wrap,
      )

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(wrapBase, fullWidth && 'w-full', !isPills && fullWidth && 'flex', className)}
    >
      <LayoutGroup id={layoutId}>
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative inline-flex items-center justify-center gap-1.5 rounded-full font-medium tracking-tight whitespace-nowrap',
                'transition-colors duration-200 ease-out-expo',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isPills ? 'h-9 px-4 text-sm' : sizing.tab,
                fullWidth && 'flex-1',
                active
                  ? cn(ACCENT_ACTIVE_TEXT[accent], 'text-foreground')
                  : 'text-muted-foreground hover:text-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {active && (
                <motion.span
                  layoutId={`tab-bg-${layoutId}`}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    isPills
                      ? cn(ACCENT_BG[accent], 'opacity-15')
                      : 'bg-surface-0 shadow-xs ring-1 ring-border-subtle',
                  )}
                  transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {item.icon}
                {item.label}
                {item.badge}
              </span>
            </button>
          )
        })}
      </LayoutGroup>
    </div>
  )
}

export type { TabItem, TabsProps, TabsVariant, TabsSize, AccentRole }
