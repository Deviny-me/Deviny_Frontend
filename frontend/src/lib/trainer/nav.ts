import {
  LayoutGrid,
  Users,
  Dumbbell,
  Calendar,
  MessageSquare,
  DollarSign,
  User,
  Settings,
  LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const trainerNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/trainer/dashboard', icon: LayoutGrid },
  { title: 'Клиенты', href: '/trainer/clients', icon: Users },
  { title: 'Программы', href: '/trainer/programs', icon: Dumbbell },
  { title: 'Расписание', href: '/trainer/schedule', icon: Calendar },
  { title: 'Чат', href: '/trainer/chat', icon: MessageSquare },
  { title: 'Финансы', href: '/trainer/finance', icon: DollarSign },
  { title: 'Профиль', href: '/trainer/profile', icon: User },
  { title: 'Настройки', href: '/trainer/settings', icon: Settings },
]
