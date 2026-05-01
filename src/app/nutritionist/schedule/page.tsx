'use client'

import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { nutritionistScheduleApi } from '@/lib/api/nutritionistScheduleApi'
import { nutritionistClientsApi } from '@/lib/api/nutritionistClientsApi'

export default function NutritionistSchedulePage() {
  return <ScheduleContent api={nutritionistScheduleApi} fetchStudents={nutritionistClientsApi.getClients} />
}
