'use client'

import { HomeFeed } from '@/components/shared/screens/HomeFeed'
import { useAuth } from '@/features/auth/AuthContext'

export function TrainerHomeFeed() {
  const { user } = useAuth()

  return <HomeFeed currentUserId={user?.id} accentColor="orange" />
}
