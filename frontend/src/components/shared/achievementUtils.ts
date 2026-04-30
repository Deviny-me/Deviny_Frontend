'use client'

import {
  Apple,
  Award,
  Dumbbell,
  Flame,
  Heart,
  Lock,
  MessageCircle,
  PenLine,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  apple: Apple,
  award: Award,
  dumbbell: Dumbbell,
  flame: Flame,
  heart: Heart,
  lock: Lock,
  'message-circle': MessageCircle,
  'pen-line': PenLine,
  star: Star,
  target: Target,
  trophy: Trophy,
  zap: Zap,
}

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700',
  teal: 'from-teal-500 to-teal-700',
  emerald: 'from-green-500 to-green-700',
  purple: 'from-purple-500 to-purple-700',
  orange: 'from-[#f07915] to-[#d4600b]',
  red: 'from-red-500 to-red-700',
  yellow: 'from-yellow-400 to-yellow-600',
  pink: 'from-pink-500 to-pink-700',
  cyan: 'from-cyan-500 to-cyan-700',
}

const rarityBorder: Record<string, string> = {
  Common: 'border-gray-500/40',
  Rare: 'border-blue-500/50',
  Epic: 'border-purple-500/50',
  Legendary: 'border-yellow-500/50',
}

const rarityGlow: Record<string, string> = {
  Common: '',
  Rare: 'shadow-blue-500/20',
  Epic: 'shadow-purple-500/20',
  Legendary: 'shadow-yellow-500/30 shadow-lg',
}

const rarityLabel: Record<string, string> = {
  Common: 'text-gray-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
}

export function getIcon(iconKey: string): LucideIcon {
  return iconMap[iconKey] || Award
}

export function getGradient(colorKey: string): string {
  return colorMap[colorKey] || colorMap.orange
}

export function getRarityBorder(rarity: string): string {
  return rarityBorder[rarity] || rarityBorder.Common
}

export function getRarityGlow(rarity: string): string {
  return rarityGlow[rarity] || ''
}

export function getRarityLabelColor(rarity: string): string {
  return rarityLabel[rarity] || rarityLabel.Common
}
