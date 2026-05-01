import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white shadow-md dark:bg-neutral-900 dark:shadow-neutral-900/50',
      elevated: 'bg-white shadow-lg dark:bg-neutral-900 dark:shadow-neutral-900/50',
      outlined: 'bg-white border-2 border-gray-200 dark:bg-neutral-900 dark:border-neutral-800',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all p-2 sm:p-4 md:p-6 lg:p-8 text-sm sm:text-base',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
