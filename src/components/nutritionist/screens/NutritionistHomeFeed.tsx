'use client'

import { HomeFeed } from '@/components/shared/screens/HomeFeed'
import { useLevel } from '@/components/level/LevelProvider'
import { useAuth } from '@/features/auth/AuthContext'

export function NutritionistHomeFeed() {
  const { refreshLevel } = useLevel()
  const { user } = useAuth()

  return <HomeFeed currentUserId={user?.id} accentColor="green" onPostUploaded={refreshLevel} disableCenterShift />
}
