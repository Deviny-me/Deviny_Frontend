import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type IconButtonVariant = 'ghost' | 'subtle' | 'outline' | 'solid'
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Required for accessibility — describes the action. */
  ariaLabel: string
  children: ReactNode
}

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  ghost:   'bg-transparent text-muted-foreground hover:text-foreground hover:bg-hover-overlay',
  subtle:  'bg-surface-2 text-foreground hover:bg-surface-4',
  outline: 'bg-transparent text-foreground ring-1 ring-inset ring-border hover:bg-hover-overlay hover:ring-border-strong',
  solid:   'bg-foreground text-background hover:opacity-90',
}

const SIZE_STYLES: Record<IconButtonSize, string> = {
  xs: 'h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5',
  sm: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-10 w-10 [&>svg]:h-[18px] [&>svg]:w-[18px]',
  lg: 'h-12 w-12 [&>svg]:h-5 [&>svg]:w-5',
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', ariaLabel, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'transition-[background-color,color,box-shadow,transform] duration-200 ease-out-expo',
          'active:scale-[0.94] active:duration-75',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'

export { IconButton }
export type { IconButtonProps, IconButtonVariant, IconButtonSize }
