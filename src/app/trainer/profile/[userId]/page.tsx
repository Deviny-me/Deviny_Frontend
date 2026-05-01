'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { PublicProfileContent } from '@/components/shared/PublicProfileContent'

function OtherUserProfilePageTrainerInner() {
  const params = useParams()
  const userId = params.userId as string
  const { user: authUser } = useAuth()

  return (
    <PublicProfileContent
      profileIdentifier={userId}
      currentUserId={authUser?.id}
      basePath="/trainer"
      ownProfilePath="/trainer/profile"
    />
  )
}

export default function OtherUserProfilePageTrainer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#f07915] animate-spin" />
      </div>
    }>
      <OtherUserProfilePageTrainerInner />
    </Suspense>
  )
}
