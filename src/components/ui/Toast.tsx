'use client'

import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
  className?: string
}

/**
 * Shared toast notification component.
 * Auto-dismisses after duration (default 4 seconds).
 */
export function Toast({ 
  message, 
  type, 
  onClose,
  duration = 4000,
  className 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const styles = {
    success: 'bg-emerald-500/90 backdrop-blur-lg border border-emerald-400/20',
    error: 'bg-red-500/90 backdrop-blur-lg border border-red-400/20',
    info: 'bg-blue-500/90 backdrop-blur-lg border border-blue-400/20'
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />
  }

  return (
    <div className={cn(
      'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl shadow-black/20 text-foreground animate-in slide-in-from-bottom-2 fade-in duration-200',
      styles[type],
      className
    )}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
