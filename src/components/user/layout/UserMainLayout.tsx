'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, userConfig } from '@/components/shared/layout'
import { UserTopNav } from './UserTopNav'
import { UserFooter } from './UserFooter'

interface UserMainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  rightSidebar?: ReactNode
}

/**
 * User main layout using shared components.
 */
export function UserMainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true,
  rightSidebar,
}: UserMainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<UserTopNav />}
      leftSidebarSections={userConfig.navSections}
      mobilePrimaryLinks={userConfig.mobilePrimaryLinks}
      mobileSecondaryLinks={userConfig.topNavItems}
      footer={<UserFooter />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={showRightSidebar && Boolean(rightSidebar)}
      rightSidebar={rightSidebar}
      accentColor="blue"
    >
      {children}
    </SharedMainLayout>
  )
}
