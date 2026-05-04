import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  containerClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, label, hint, error, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const describedById = hint || error ? `${inputId}-desc` : undefined

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
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedById}
          className={cn(
            'w-full rounded-lg bg-surface-2 text-foreground placeholder:text-faint-foreground',
            'px-3.5 py-2.5 text-sm leading-relaxed resize-y min-h-[88px]',
            'ring-1 ring-inset ring-border',
            'transition-[box-shadow,background-color,border-color] duration-200 ease-out-expo',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:bg-surface-1',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'ring-red-500/60 focus:ring-red-500/70',
            className,
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
