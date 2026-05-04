import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'flat'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  interactive?: boolean
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:
    'bg-surface-1 ring-1 ring-border-subtle shadow-xs',
  elevated:
    'bg-surface-1 ring-1 ring-border-subtle shadow-md',
  outlined:
    'bg-transparent ring-1 ring-border',
  glass:
    'bg-surface-1/70 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-border-subtle shadow-sm',
  flat:
    'bg-surface-2',
}

const PADDING_STYLES: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3 sm:p-4',
  md:   'p-4 sm:p-5 md:p-6',
  lg:   'p-5 sm:p-6 md:p-8',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl text-sm sm:text-base text-foreground',
          'transition-[background-color,box-shadow,transform,border-color] duration-250 ease-out-expo',
          VARIANT_STYLES[variant],
          PADDING_STYLES[padding],
          interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export { Card }
export type { CardProps, CardVariant, CardPadding }
