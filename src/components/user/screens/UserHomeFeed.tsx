'use client'

import { useUser } from '@/components/user/UserProvider'
import { HomeFeed } from '@/components/shared/screens/HomeFeed'

export function UserHomeFeed() {
  const { user } = useUser()

  return <HomeFeed currentUserId={user?.id} accentColor="blue" />
}
