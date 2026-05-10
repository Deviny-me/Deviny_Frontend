'use client'

import { ReactNode } from 'react'
import { SharedMainLayout, nutritionistConfig } from '@/components/shared/layout'
import { TopNav } from './TopNav'
import { NutritionistFooter } from './NutritionistFooter'

interface MainLayoutProps {
  children: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  rightSidebar?: ReactNode
}

/**
 * Nutritionist main layout using shared components.
 */
export function MainLayout({ 
  children, 
  showLeftSidebar = true, 
  showRightSidebar = true,
  rightSidebar,
}: MainLayoutProps) {
  return (
    <SharedMainLayout
      topNav={<TopNav />}
      leftSidebarSections={nutritionistConfig.navSections}
      mobilePrimaryLinks={nutritionistConfig.mobilePrimaryLinks}
      mobileSecondaryLinks={nutritionistConfig.topNavItems}
      footer={<NutritionistFooter />}
      showLeftSidebar={showLeftSidebar}
      showRightSidebar={showRightSidebar && Boolean(rightSidebar)}
      rightSidebar={rightSidebar}
      accentColor="green"
    >
      {children}
    </SharedMainLayout>
  )
}
