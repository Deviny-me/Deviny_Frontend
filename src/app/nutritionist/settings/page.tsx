'use client'

import { ExpertSettingsContent } from '@/components/shared/ExpertSettingsContent'
import { fetchNutritionistProfile, uploadNutritionistBanner, deleteNutritionistBanner } from '@/lib/api/nutritionistProfileApi'

export default function NutritionistSettingsPage() {
  return (
    <ExpertSettingsContent
      basePath="/nutritionist"
      fetchProfile={fetchNutritionistProfile}
      uploadBanner={uploadNutritionistBanner}
      deleteBanner={deleteNutritionistBanner}
    />
  )
}
