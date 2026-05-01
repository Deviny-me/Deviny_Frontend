'use client'

import { useState, useEffect } from 'react'
import { X, Star, RotateCcw, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import type { ProgramsFilterParams } from '@/lib/api/programsApi'

interface ProgramsFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: ProgramsFilterParams) => void
  currentFilters: ProgramsFilterParams
}

export function ProgramsFilterModal({ isOpen, onClose, onApply, currentFilters }: ProgramsFilterModalProps) {
  const t = useTranslations('userPrograms.filter')
  const accent = useAccentColors()

  const [minPrice, setMinPrice] = useState<string>(currentFilters.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState<string>(currentFilters.maxPrice?.toString() || '')
  const [minRating, setMinRating] = useState(currentFilters.minRating || 0)
  const [tier, setTier] = useState(currentFilters.tier || '')

  useEffect(() => {
    if (isOpen) {
      setMinPrice(currentFilters.minPrice?.toString() || '')
      setMaxPrice(currentFilters.maxPrice?.toString() || '')
      setMinRating(currentFilters.minRating || 0)
      setTier(currentFilters.tier || '')
    }
  }, [isOpen, currentFilters])

  const handleApply = () => {
    onApply({
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      tier: tier || undefined,
    })
    onClose()
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
    setTier('')
  }

  const inputClass = 'w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 top-auto max-h-[85vh] overflow-y-auto bg-surface-3 rounded-2xl border border-border z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md"
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface-3 flex items-center justify-between p-4 border-b border-border z-10">
              <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('reset')}
                </button>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('minRating')}</label>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        minRating === r
                          ? 'text-white'
                          : 'bg-surface-2 border border-border-subtle text-muted-foreground hover:text-foreground'
                      }`}
                      style={minRating === r ? { background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` } : undefined}
                    >
                      {r === 0 ? (
                        t('any')
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {r === 5 ? r : `${r}+`}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                  {t('priceRange')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t('minPrice')}
                    className={inputClass}
                    style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t('maxPrice')}
                    className={inputClass}
                    style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Program Tier / Package */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('programTier')}</label>
                <div className="flex gap-2">
                  {['', 'Basic', 'Standard', 'Pro'].map((t_val) => (
                    <button
                      key={t_val}
                      onClick={() => setTier(t_val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        tier === t_val
                          ? 'text-white'
                          : 'bg-surface-2 border border-border-subtle text-muted-foreground hover:text-foreground'
                      }`}
                      style={tier === t_val ? { background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` } : undefined}
                    >
                      {t_val === '' ? t('allTiers') : t_val === 'Basic' ? t('basic') : t_val === 'Standard' ? t('standard') : t('pro')}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Apply Button */}
            <div className="sticky bottom-0 bg-surface-3 p-4 border-t border-border">
              <button
                onClick={handleApply}
                className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` }}
              >
                {t('apply')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
