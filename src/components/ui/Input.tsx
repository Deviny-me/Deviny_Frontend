import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils/cn'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize
  label?: string
  hint?: string
  error?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  containerClassName?: string
}

const SIZE_STYLES: Record<InputSize, string> = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-12 text-base',
}

const SIZE_PADDING: Record<InputSize, { base: string; left: string; right: string }> = {
  sm: { base: 'px-3', left: 'pl-9', right: 'pr-9' },
  md: { base: 'px-3.5', left: 'pl-10', right: 'pr-10' },
  lg: { base: 'px-4', left: 'pl-11', right: 'pr-11' },
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      inputSize = 'md',
      label,
      hint,
      error,
      iconLeft,
      iconRight,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const describedById = hint || error ? `${inputId}-desc` : undefined

    const padding = SIZE_PADDING[inputSize]

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-muted-foreground tracking-tight"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-faint-foreground',
                inputSize === 'lg' && 'pl-3.5',
              )}
              aria-hidden
            >
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedById}
            className={cn(
              // Base
              'w-full rounded-lg bg-surface-2 text-foreground placeholder:text-faint-foreground',
              'ring-1 ring-inset ring-border',
              'transition-[box-shadow,background-color,color,border-color] duration-200 ease-out-expo',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:bg-surface-1',
              'disabled:cursor-not-allowed disabled:opacity-60',
              SIZE_STYLES[inputSize],
              iconLeft ? padding.left : padding.base,
              iconRight ? padding.right : padding.base,
              error && 'ring-red-500/60 focus:ring-red-500/70',
              className,
            )}
            {...props}
          />
          {iconRight && (
            <span
              className={cn(
                'absolute inset-y-0 right-0 flex items-center pr-3 text-faint-foreground',
                inputSize === 'lg' && 'pr-3.5',
              )}
            >
              {iconRight}
            </span>
          )}
        </div>
        {(hint || error) && (
          <p
            id={describedById}
            className={cn(
              'text-xs tracking-tight',
              error ? 'text-red-500' : 'text-faint-foreground',
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
export type { InputProps, InputSize }
