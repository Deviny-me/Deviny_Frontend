'use client'

import { StudentsClientsContent } from '@/components/shared/StudentsClientsContent'
import { studentsApi } from '@/lib/api/studentsApi'

export default function TrainerStudentsPage() {
  return <StudentsClientsContent fetchData={() => studentsApi.getStudents()} />
}
