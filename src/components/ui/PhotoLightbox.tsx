'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PhotoLightboxProps {
  imageUrl: string
  caption?: string
  onClose: () => void
  className?: string
}

/**
 * Fullscreen photo lightbox overlay.
 * Press ESC or click outside to close.
 */
export function PhotoLightbox({ 
  imageUrl, 
  caption,
  onClose,
  className 
}: PhotoLightboxProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6 text-foreground" />
      </button>
      
      <div 
        className="max-w-4xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={caption || 'Photo'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        {caption && (
          <p className="mt-3 text-center text-foreground text-sm">{caption}</p>
        )}
      </div>
    </div>
  )
}
