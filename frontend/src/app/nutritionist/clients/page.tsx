'use client'

import { StudentsClientsContent } from '@/components/shared/StudentsClientsContent'
import { nutritionistClientsApi } from '@/lib/api/nutritionistClientsApi'

export default function NutritionistClientsPage() {
  return <StudentsClientsContent fetchData={() => nutritionistClientsApi.getClients()} />
}
