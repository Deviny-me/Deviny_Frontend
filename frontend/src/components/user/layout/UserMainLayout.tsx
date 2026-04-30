'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, userConfig } from '@/components/shared/layout'
import { UserTopNav } from './UserTopNav'
import { UserFooter } from './UserFooter'

interface UserMainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
}

/**
 * User main layout using shared components.
 */
export function UserMainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true 
}: UserMainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<UserTopNav />}
      leftSidebarSections={userConfig.navSections}
      mobilePrimaryLinks={userConfig.mobilePrimaryLinks}
      mobileSecondaryLinks={userConfig.topNavItems}
      footer={<UserFooter />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={false}
      accentColor="blue"
    >
      {children}
    </SharedMainLayout>
  )
}
