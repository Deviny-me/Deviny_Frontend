'use client'

import { useState, useEffect } from 'react'
import { ProfileSettingsContent } from '@/components/shared/ProfileSettingsContent'
import {
  fetchTrainerProfile,
  updateTrainerProfile,
  updateAbout,
  uploadTrainerAvatar,
  deleteTrainerAvatar,
  uploadTrainerBanner,
  deleteTrainerBanner,
} from '@/lib/api/trainerProfileApi'
import { updateUserProfile } from '@/lib/api/userApi'
import { Loader2 } from 'lucide-react'

export default function TrainerProfileSettingsPage() {
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
        const data = await fetchTrainerProfile()
        setProfessionalData({
          primaryTitle: data.trainer?.primaryTitle || undefined,
          secondaryTitle: data.trainer?.secondaryTitle || undefined,
          experienceYears: data.trainer?.experienceYears || undefined,
          about: data.about?.text || undefined,
        })
      } catch (error) {
        console.error('Failed to load trainer profile:', error)
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
    await updateTrainerProfile({
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
        <Loader2 className="w-8 h-8 text-[#f07915] animate-spin" />
      </div>
    )
  }

  return (
    <ProfileSettingsContent
      basePath="/trainer"
      role="trainer"
      onSaveProfessional={handleSaveProfessional}
      professionalData={professionalData}
      expertAvatarUpload={uploadTrainerAvatar}
      expertAvatarDelete={deleteTrainerAvatar}
      expertBannerUpload={uploadTrainerBanner}
      expertBannerDelete={deleteTrainerBanner}
    />
  )
}
