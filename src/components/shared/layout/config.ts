import {
  Award,
  BarChart3,
  Calendar,
  Home,
  Compass,
  BookOpen,
  Trophy,
  Radio,
  Target,
  GraduationCap,
  Layers,
  Users,
  MessageCircle,
  User,
  Settings,
  Apple,
  Bell,
} from 'lucide-react'
import { LayoutConfig } from './types'

/**
 * Navigation configuration for trainers.
 * Labels use i18n keys from the 'nav' namespace.
 */
export const trainerConfig: LayoutConfig = {
  role: 'trainer',
  basePath: '/trainer',
  logoText: 'TRAINER',
  searchPlaceholder: 'Search students, programs...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'home', path: '/trainer' },
        { icon: Compass, label: 'discover', path: '/trainer/discovery' },
        { icon: GraduationCap, label: 'experts', path: '/trainer/experts' },
      ]
    },
    {
      title: 'training',
      links: [
        { icon: BarChart3, label: 'dashboard', path: '/trainer/dashboard' },
        { icon: Layers, label: 'myPrograms', path: '/trainer/programs' },
        { icon: Users, label: 'students', path: '/trainer/students' },
        { icon: Radio, label: 'liveWorkouts', path: '/trainer/live' },
        { icon: Calendar, label: 'schedule', path: '/trainer/schedule' },
      ]
    },
    {
      title: 'compete',
      links: [
        { icon: Target, label: 'challenges', path: '/trainer/challenges' },
        { icon: Trophy, label: 'leaderboards', path: '/trainer/leaderboards' },
        { icon: Award, label: 'achievements', path: '/trainer/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'friends', path: '/trainer/friends' },
    { icon: Bell, label: 'notifications', path: '/trainer/notifications' },
    { icon: MessageCircle, label: 'messages', path: '/trainer/messages' },
    { icon: User, label: 'myProfile', path: '/trainer/profile' },
    { icon: Settings, label: 'settings', path: '/trainer/settings' },
  ],
  mobilePrimaryLinks: [
    { icon: Home, label: 'home', path: '/trainer' },
    { icon: BarChart3, label: 'dashboard', path: '/trainer/dashboard' },
    { icon: Users, label: 'students', path: '/trainer/students' },
    { icon: MessageCircle, label: 'messages', path: '/trainer/messages' },
  ]
}

/**
 * Navigation configuration for users.
 * Labels use i18n keys from the 'nav' namespace.
 */
export const userConfig: LayoutConfig = {
  role: 'user',
  basePath: '/user',
  logoText: undefined,
  searchPlaceholder: 'Search trainers, programs, workouts...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'home', path: '/user' },
        { icon: Compass, label: 'discover', path: '/user/discovery' },
        { icon: GraduationCap, label: 'experts', path: '/user/experts' },
      ]
    },
    {
      title: 'training',
      links: [
        { icon: Layers, label: 'programs', path: '/user/programs' },
        { icon: BookOpen, label: 'myJourney', path: '/user/journey' },
        { icon: Radio, label: 'liveWorkouts', path: '/user/live' },
        { icon: Calendar, label: 'schedule', path: '/user/schedule' },
      ]
    },
    {
      title: 'compete',
      links: [
        { icon: Target, label: 'challenges', path: '/user/challenges' },
        { icon: Trophy, label: 'leaderboards', path: '/user/leaderboards' },
        { icon: Award, label: 'achievements', path: '/user/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'friends', path: '/user/friends' },
    { icon: Bell, label: 'notifications', path: '/user/notifications' },
    { icon: MessageCircle, label: 'messages', path: '/user/messages' },
    { icon: User, label: 'profile', path: '/user/profile' },
    { icon: Settings, label: 'settings', path: '/user/settings' },
  ],
  mobilePrimaryLinks: [
    { icon: Home, label: 'home', path: '/user' },
    { icon: Compass, label: 'discover', path: '/user/discovery' },
    { icon: BookOpen, label: 'myJourney', path: '/user/journey' },
    { icon: MessageCircle, label: 'messages', path: '/user/messages' },
  ]
}

/**
 * Navigation configuration for nutritionists.
 * Labels use i18n keys from the 'nav' namespace.
 */
export const nutritionistConfig: LayoutConfig = {
  role: 'nutritionist',
  basePath: '/nutritionist',
  logoText: 'NUTRITIONIST',
  searchPlaceholder: 'Search clients, programs...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'home', path: '/nutritionist' },
        { icon: Compass, label: 'discover', path: '/nutritionist/discovery' },
        { icon: GraduationCap, label: 'experts', path: '/nutritionist/experts' },
      ]
    },
    {
      title: 'nutritionSection',
      links: [
        { icon: BarChart3, label: 'dashboard', path: '/nutritionist/dashboard' },
        { icon: Apple, label: 'mealPrograms', path: '/nutritionist/programs' },
        { icon: Users, label: 'students', path: '/nutritionist/clients' },
        { icon: Radio, label: 'live', path: '/nutritionist/live' },
        { icon: Calendar, label: 'schedule', path: '/nutritionist/schedule' },
      ]
    },
    {
      title: 'compete',
      links: [
        { icon: Target, label: 'challenges', path: '/nutritionist/challenges' },
        { icon: Trophy, label: 'leaderboards', path: '/nutritionist/leaderboards' },
        { icon: Award, label: 'achievements', path: '/nutritionist/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'friends', path: '/nutritionist/friends' },
    { icon: Bell, label: 'notifications', path: '/nutritionist/notifications' },
    { icon: MessageCircle, label: 'messages', path: '/nutritionist/messages' },
    { icon: User, label: 'myProfile', path: '/nutritionist/profile' },
    { icon: Settings, label: 'settings', path: '/nutritionist/settings' },
  ],
  mobilePrimaryLinks: [
    { icon: Home, label: 'home', path: '/nutritionist' },
    { icon: BarChart3, label: 'dashboard', path: '/nutritionist/dashboard' },
    { icon: Users, label: 'clients', path: '/nutritionist/clients' },
    { icon: MessageCircle, label: 'messages', path: '/nutritionist/messages' },
  ]
}

/**
 * Get layout configuration by role.
 */
export function getLayoutConfig(role: 'trainer' | 'user' | 'nutritionist'): LayoutConfig {
  switch (role) {
    case 'trainer': return trainerConfig
    case 'nutritionist': return nutritionistConfig
    default: return userConfig
  }
}
