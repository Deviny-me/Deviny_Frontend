import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'user' | 'trainer' | 'nutritionist' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]'
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25 focus-visible:ring-primary-500',
      user: 'bg-user-600 text-white hover:bg-user-700 hover:shadow-lg hover:shadow-user-500/25 focus-visible:ring-user-500',
      trainer: 'bg-trainer-600 text-white hover:bg-trainer-700 hover:shadow-lg hover:shadow-trainer-500/25 focus-visible:ring-trainer-500',
      nutritionist: 'bg-nutritionist-600 text-white hover:bg-nutritionist-700 hover:shadow-lg hover:shadow-nutritionist-500/25 focus-visible:ring-nutritionist-500',
      outline: 'border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus-visible:ring-gray-500',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
