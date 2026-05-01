'use client'

import { ProfileSettingsContent } from '@/components/shared/ProfileSettingsContent'

export default function UserProfileSettingsPage() {
  return (
    <ProfileSettingsContent
      basePath="/user"
      role="user"
    />
  )
}
