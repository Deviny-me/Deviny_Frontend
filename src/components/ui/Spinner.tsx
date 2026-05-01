'use client'

import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'user' | 'trainer' | 'nutritionist'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

const colorClasses = {
  primary: 'border-primary-200 border-t-primary-600',
  white: 'border-white/30 border-t-white',
  user: 'border-user-200 border-t-user-600',
  trainer: 'border-trainer-200 border-t-trainer-600',
  nutritionist: 'border-nutritionist-200 border-t-nutritionist-600',
}

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={cn('animate-spin rounded-full', sizeClasses[size], colorClasses[color], className)}
      role="status"
      aria-label="Loading"
    />
  )
}

export function FullPageSpinner({ color = 'primary' }: { color?: SpinnerProps['color'] }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" color={color} />
    </div>
  )
}
