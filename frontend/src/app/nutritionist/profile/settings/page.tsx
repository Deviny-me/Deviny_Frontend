'use client'

import { useState, useEffect } from 'react'
import { ProfileSettingsContent } from '@/components/shared/ProfileSettingsContent'
import {
  fetchNutritionistProfile,
  updateNutritionistProfile,
  updateAbout,
  uploadNutritionistAvatar,
  deleteNutritionistAvatar,
  uploadNutritionistBanner,
  deleteNutritionistBanner,
} from '@/lib/api/nutritionistProfileApi'
import { Loader2 } from 'lucide-react'

export default function NutritionistProfileSettingsPage() {
  const [professionalData, setProfessionalData] = useState<{
    primaryTitle?: string
    secondaryTitle?: string
    experienceYears?: number
    about?: string
  } | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNutritionistProfile()
        setProfessionalData({
          primaryTitle: data.trainer?.primaryTitle || undefined,
          secondaryTitle: data.trainer?.secondaryTitle || undefined,
          experienceYears: data.trainer?.experienceYears || undefined,
          about: data.about?.text || undefined,
        })
      } catch (error) {
        console.error('Failed to load nutritionist profile:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSaveProfessional = async (data: {
    primaryTitle?: string
    secondaryTitle?: string
    experienceYears?: number
    about?: string
  }) => {
    await updateNutritionistProfile({
      primaryTitle: data.primaryTitle,
      secondaryTitle: data.secondaryTitle,
      experienceYears: data.experienceYears,
    })
    if (data.about !== undefined) {
      await updateAbout(data.about || '')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#28bf68] animate-spin" />
      </div>
    )
  }

  return (
    <ProfileSettingsContent
      basePath="/nutritionist"
      role="nutritionist"
      onSaveProfessional={handleSaveProfessional}
      professionalData={professionalData}
      expertAvatarUpload={uploadNutritionistAvatar}
      expertAvatarDelete={deleteNutritionistAvatar}
      expertBannerUpload={uploadNutritionistBanner}
      expertBannerDelete={deleteNutritionistBanner}
    />
  )
}
