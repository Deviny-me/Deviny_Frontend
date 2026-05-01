'use client'

import { ReactNode } from 'react'
import { SharedLeftSidebar } from './SharedLeftSidebar'
import { NavLink, NavSection } from './types'
import { SharedMobileNav } from './SharedMobileNav'

interface SharedMainLayoutProps {
  children: ReactNode
  topNav: ReactNode
  leftSidebarSections: NavSection[]
  mobilePrimaryLinks: NavLink[]
  mobileSecondaryLinks: NavLink[]
  rightSidebar?: ReactNode
  footer?: ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  accentColor?: 'orange' | 'green' | 'blue'
  className?: string
}

/**
 * Shared main layout component.
 * Configurable via props for different user roles.
 */
export function SharedMainLayout({ 
  children,
  topNav,
  leftSidebarSections,
  mobilePrimaryLinks,
  mobileSecondaryLinks,
  rightSidebar,
  footer,
  showLeftSidebar = true, 
  showRightSidebar = true,
  accentColor = 'orange',
  className,
}: SharedMainLayoutProps) {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className || ''}`}>
      {topNav}
      <div className="flex-1 w-full max-w-full md:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 pt-2 md:pt-5">
          {/* Left Sidebar */}
          {showLeftSidebar && (
            <div className="hidden lg:block">
              <SharedLeftSidebar sections={leftSidebarSections} accentColor={accentColor} />
            </div>
          )}
          {/* Main Content */}
          <div className="flex-1 min-w-0 pb-24 lg:pb-8">
            {children}
          </div>
          {/* Right Sidebar */}
          {showRightSidebar && rightSidebar && (
            <div className="hidden xl:block">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      {footer && (
        <footer className="mt-auto border-t border-border-subtle">
          <div className="max-w-full md:max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-5">
            {footer}
          </div>
        </footer>
      )}
      <SharedMobileNav
        primaryLinks={mobilePrimaryLinks}
        sections={leftSidebarSections}
        secondaryLinks={mobileSecondaryLinks}
        accentColor={accentColor}
      />
    </div>
  )
}
