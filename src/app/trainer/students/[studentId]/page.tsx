'use client'

import { StudentDetailContent } from '@/components/shared/StudentDetailContent'
import { studentsApi } from '@/lib/api/studentsApi'

export default function TrainerStudentDetailPage({
  params,
}: {
  params: { studentId: string }
}) {
  return (
    <StudentDetailContent
      studentId={params.studentId}
      role="trainer"
      fetchDetail={(id) => studentsApi.getStudentDetail(id)}
      submitReview={(id, data) => studentsApi.submitReview(id, data)}
      backPath="/trainer/students"
      basePath="/trainer"
    />
  )
}
