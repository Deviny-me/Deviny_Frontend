'use client'

import { useState, useEffect } from 'react'
import { X, Star, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { getCountries, getCitiesForCountry } from '@/lib/data/countries'
import type { ExpertsFilterParams } from '@/lib/api/trainersApi'

interface ExpertsFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: ExpertsFilterParams) => void
  currentFilters: ExpertsFilterParams
}

export function ExpertsFilterModal({ isOpen, onClose, onApply, currentFilters }: ExpertsFilterModalProps) {
  const t = useTranslations('experts.filter')
  const accent = useAccentColors()
  const { language } = useLanguage()

  const [country, setCountry] = useState(currentFilters.country || '')
  const [city, setCity] = useState(currentFilters.city || '')
  const [gender, setGender] = useState(currentFilters.gender || '')
  const [specialization, setSpecialization] = useState(currentFilters.specialization || '')
  const [minRating, setMinRating] = useState(currentFilters.minRating || 0)

  useEffect(() => {
    if (isOpen) {
      setCountry(currentFilters.country || '')
      setCity(currentFilters.city || '')
      setGender(currentFilters.gender || '')
      setSpecialization(currentFilters.specialization || '')
      setMinRating(currentFilters.minRating || 0)
    }
  }, [isOpen, currentFilters])

  const countries = getCountries(language)
  const countryCode = country || ''
  const cities = countryCode ? getCitiesForCountry(countryCode) : []

  const handleApply = () => {
    onApply({
      country: country || undefined,
      city: city || undefined,
      gender: gender || undefined,
      specialization: specialization || undefined,
      minRating: minRating > 0 ? minRating : undefined,
    })
    onClose()
  }

  const handleReset = () => {
    setCountry('')
    setCity('')
    setGender('')
    setSpecialization('')
    setMinRating(0)
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
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('country')}</label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setCity('') }}
                  className={inputClass}
                  style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                >
                  <option value="">{t('allCountries')}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('city')}</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!countryCode}
                  className={`${inputClass} disabled:opacity-40`}
                  style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                >
                  <option value="">{t('allCities')}</option>
                  {cities.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('gender')}</label>
                <div className="flex gap-2">
                  {['', 'Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        gender === g
                          ? 'text-white'
                          : 'bg-surface-2 border border-border-subtle text-muted-foreground hover:text-foreground'
                      }`}
                      style={gender === g ? { background: `linear-gradient(to right, ${accent.primary}, ${accent.secondary})` } : undefined}
                    >
                      {g === '' ? t('anyGender') : g === 'Male' ? t('male') : t('female')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">{t('specialization')}</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder={t('specializationPlaceholder')}
                  className={inputClass}
                  style={{ '--tw-ring-color': accent.primary } as React.CSSProperties}
                />
              </div>

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
