'use client'

import { ScheduleContent } from '@/components/shared/ScheduleContent'
import { scheduleApi } from '@/lib/api/scheduleApi'
import { studentsApi } from '@/lib/api/studentsApi'

export default function TrainerSchedulePage() {
  return <ScheduleContent api={scheduleApi} fetchStudents={studentsApi.getStudents} />
}
