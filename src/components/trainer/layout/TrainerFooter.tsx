'use client'

import { useTranslations } from 'next-intl'

export function TrainerFooter() {
  const ts = useTranslations('userRightSidebar')

  return (
    <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left gap-3 md:gap-4">
      <div className="flex flex-col items-center gap-2 md:flex-row">
        <p className="text-xs text-gray-600">{ts('copyright')}</p>
      </div>
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <a href="#" className="hover:text-[#f07915] transition-colors">{ts('about')}</a>
        <a href="#" className="hover:text-[#f07915] transition-colors">{ts('helpCenter')}</a>
        <a href="#" className="hover:text-[#f07915] transition-colors">{ts('privacy')}</a>
        <a href="#" className="hover:text-[#f07915] transition-colors">{ts('terms')}</a>
      </div>
    </div>
  )
}
