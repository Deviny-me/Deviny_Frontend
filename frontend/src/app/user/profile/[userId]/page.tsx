'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useUser } from '@/components/user/UserProvider'
import { PublicProfileContent } from '@/components/shared/PublicProfileContent'

function OtherUserProfilePageInner() {
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser } = useUser()

  return (
    <PublicProfileContent
      profileIdentifier={userId}
      currentUserId={currentUser?.id}
      basePath="/user"
      ownProfilePath="/user/profile"
    />
  )
}

export default function OtherUserProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
      </div>
    }>
      <OtherUserProfilePageInner />
    </Suspense>
  )
}