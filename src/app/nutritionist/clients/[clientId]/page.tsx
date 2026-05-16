'use client'

import { StudentDetailContent } from '@/components/shared/StudentDetailContent'
import { nutritionistClientsApi } from '@/lib/api/nutritionistClientsApi'

export default function NutritionistClientDetailPage({
  params,
}: {
  params: { clientId: string }
}) {
  return (
    <StudentDetailContent
      studentId={params.clientId}
      role="nutritionist"
      fetchDetail={(id) => nutritionistClientsApi.getClientDetail(id)}
      submitReview={(id, data) => nutritionistClientsApi.submitReview(id, data)}
      backPath="/nutritionist/clients"
      basePath="/nutritionist"
    />
  )
}
