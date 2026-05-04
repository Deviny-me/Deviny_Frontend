import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ButtonVariant =
  | 'primary'
  | 'user'
  | 'trainer'
  | 'nutritionist'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'success'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
type ButtonShape = 'pill' | 'rounded'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  fullWidth?: boolean
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

/* ─── Variant styles ───
 * Premium look: subtle hairline ring on hover, soft colored shadow, no harsh borders.
 * All variants use new design tokens and respect light/dark themes.
 */
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-glow-primary focus-visible:ring-primary-500',
  user:
    'bg-user-600 text-white shadow-sm hover:bg-user-700 hover:shadow-glow-user focus-visible:ring-user-500',
  trainer:
    'bg-trainer-600 text-white shadow-sm hover:bg-trainer-700 hover:shadow-glow-trainer focus-visible:ring-trainer-500',
  nutritionist:
    'bg-nutritionist-600 text-white shadow-sm hover:bg-nutritionist-700 hover:shadow-glow-nutritionist focus-visible:ring-nutritionist-500',

  secondary:
    'bg-surface-2 text-foreground ring-1 ring-inset ring-border hover:bg-surface-4 hover:ring-border-strong shadow-xs',
  outline:
    'bg-transparent text-foreground ring-1 ring-inset ring-border hover:bg-hover-overlay hover:ring-border-strong',
  ghost:
    'bg-transparent text-foreground hover:bg-hover-overlay',
  destructive:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_8px_24px_-8px_rgba(239,68,68,0.45)] focus-visible:ring-red-500',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_8px_24px_-8px_rgba(16,185,129,0.45)] focus-visible:ring-emerald-500',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs gap-1.5',
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const SHAPE_STYLES: Record<ButtonShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      shape = 'pill',
      fullWidth,
      loading,
      iconLeft,
      iconRight,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          // Base
          'relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold tracking-tight',
          'transition-[background-color,box-shadow,transform,color,opacity] duration-200 ease-out-expo',
          'active:scale-[0.97] active:duration-75',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          SHAPE_STYLES[shape],
          SIZE_STYLES[size],
          VARIANT_STYLES[variant],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
        )}
        {children && <span className={cn(loading && 'opacity-90')}>{children}</span>}
        {!loading && iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonShape }
