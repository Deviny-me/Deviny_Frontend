import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'user' | 'trainer' | 'nutritionist' | 'gray'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'gray', children, ...props }, ref) => {
    const variants = {
      user: 'bg-user-100 text-user-700',
      trainer: 'bg-trainer-100 text-trainer-700',
      nutritionist: 'bg-nutritionist-100 text-nutritionist-700',
      gray: 'bg-gray-100 text-gray-700',
    }
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
