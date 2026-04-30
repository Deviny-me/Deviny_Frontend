/**
 * Shared layout components for trainer and user roles.
 */
export { SharedMainLayout } from './SharedMainLayout'
export { SharedLeftSidebar } from './SharedLeftSidebar'
export { SharedTopNav } from './SharedTopNav'
export { SharedMobileNav } from './SharedMobileNav'
export { getLayoutConfig, trainerConfig, userConfig, nutritionistConfig } from './config'
export type { 
  UserRole, 
  NavLink, 
  NavSection, 
  TopNavItem, 
  LayoutConfig 
} from './types'
export { getBasePath } from './types'
