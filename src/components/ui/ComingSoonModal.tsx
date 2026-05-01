'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ComingSoonModalProps {
  onClose: () => void
  title?: string
  message?: string
  icon?: ReactNode
  buttonText?: string
  className?: string
}

/**
 * Generic "Coming Soon" modal for features in development.
 */
export function ComingSoonModal({ 
  onClose,
  title = 'Coming Soon!',
  message = 'This feature will be available in the next update!',
  icon,
  buttonText = 'Got it!',
  className 
}: ComingSoonModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={cn(
        'bg-surface-2 rounded-xl border border-border-subtle p-6 max-w-sm mx-4 text-center',
        className
      )}>
        {icon && (
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
