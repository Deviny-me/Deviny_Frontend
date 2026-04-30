'use client'

import { useAuth } from '@/features/auth/AuthContext'

type RoleType = 'user' | 'trainer' | 'nutritionist'

/**
 * Centralized accent color system for user (blue), trainer (orange), and nutritionist (green) roles.
 * Use this hook in any shared page/component to get dynamic colors.
 */
export function useAccentColors() {
  const { user } = useAuth()
  const role: RoleType = user?.role === 'nutritionist' ? 'nutritionist' : user?.role === 'trainer' ? 'trainer' : 'user'
  return getAccentColors(role)
}

/**
 * Pure function to get accent colors based on role.
 * Accepts a RoleType string or legacy boolean (true = nutritionist, false = trainer/default).
 */
export function getAccentColors(roleOrIsNutritionist: RoleType | boolean) {
  // Legacy boolean support for backwards compat
  let role: RoleType
  if (typeof roleOrIsNutritionist === 'boolean') {
    role = roleOrIsNutritionist ? 'nutritionist' : 'trainer'
  } else {
    role = roleOrIsNutritionist
  }

  const colors = {
    nutritionist: { primary: '#28bf68', secondary: '#1c9e52' },
    trainer:      { primary: '#f07915', secondary: '#d4600b' },
    user:         { primary: '#0c8de6', secondary: '#0070c4' },
  }[role]

  const tw = {
    nutritionist: {
      heroGlow: 'from-nutritionist-500 to-nutritionist-600',
      heroText: 'from-nutritionist-500 to-nutritionist-600',
      featureCard1Bg: 'bg-nutritionist-500/10',   featureCard1Text: 'text-nutritionist-500',
      featureCard2Bg: 'bg-nutritionist-400/10',  featureCard2Text: 'text-nutritionist-400',
    },
    trainer: {
      heroGlow: 'from-trainer-500 to-trainer-600',
      heroText: 'from-trainer-500 to-trainer-600',
      featureCard1Bg: 'bg-trainer-500/10',   featureCard1Text: 'text-trainer-500',
      featureCard2Bg: 'bg-trainer-400/10',   featureCard2Text: 'text-trainer-400',
    },
    user: {
      heroGlow: 'from-user-500 to-user-600',
      heroText: 'from-user-500 to-user-600',
      featureCard1Bg: 'bg-user-500/10',    featureCard1Text: 'text-user-500',
      featureCard2Bg: 'bg-user-400/10',     featureCard2Text: 'text-user-400',
    },
  }[role]

  return {
    // Raw hex values (for inline styles)
    primary: colors.primary,
    secondary: colors.secondary,

    // Tailwind gradient classes
    gradient: `from-[${colors.primary}] to-[${colors.secondary}]`,
    gradientBg: `from-[${colors.primary}]/5 to-[${colors.secondary}]/5`,
    gradientBg10: `from-[${colors.primary}]/10 to-[${colors.secondary}]/10`,
    gradientBg20: `from-[${colors.primary}]/20 to-[${colors.secondary}]/20`,

    // Text
    text: `text-[${colors.primary}]`,
    textSecondary: `text-[${colors.secondary}]`,

    // Background
    bg: `bg-[${colors.primary}]`,
    bgMuted: `bg-[${colors.primary}]/10`,
    bgMuted20: `bg-[${colors.primary}]/20`,

    // Border
    border: `border-[${colors.primary}]`,
    borderMuted: `border-[${colors.primary}]/30`,
    borderMuted50: `border-[${colors.primary}]/50`,

    // Focus / Hover
    focusBorder: `focus:border-[${colors.primary}]`,
    hoverBorder: `hover:border-[${colors.primary}]/50`,
    hoverBorderMuted: `hover:border-[${colors.primary}]/30`,
    hoverText: `hover:text-[${colors.primary}]`,
    groupHoverText: `group-hover:text-[${colors.primary}]`,

    // Fill
    fill: `fill-[${colors.primary}]`,

    // Semantic aliases for common patterns
    loader: `text-[${colors.primary}]`,
    link: `text-[${colors.primary}]`,
    badge: `bg-[${colors.secondary}]`,

    // Leaderboard/special gradients
    heroGlow: tw.heroGlow,
    heroText: tw.heroText,
    ctaGradient: `from-[${colors.primary}] to-[${colors.secondary}]`,

    // Status-like colors
    featureCard1Bg: tw.featureCard1Bg,
    featureCard1Text: tw.featureCard1Text,
    featureCard2Bg: tw.featureCard2Bg,
    featureCard2Text: tw.featureCard2Text,

    // Ring (for avatar borders)
    ring: `ring-2 ring-[${colors.primary}]`,
    ringMuted: `ring-2 ring-[${colors.primary}]/50`,

    // For inline style objects
    style: {
      color: colors.primary,
      backgroundColor: colors.primary,
    },
  } as const
}

/**
 * Get avatar ring class based on the author's role.
 * Nutritionist → green ring, Trainer → orange ring, User → blue ring.
 */
export function getRoleRingClass(role: string | number | undefined | null): string {
  if (!role) return ''
  const r = String(role).toLowerCase()
  if (r === 'nutritionist' || r === '3') return 'ring-2 ring-[#28bf68]'
  if (r === 'trainer' || r === '1') return 'ring-2 ring-[#f07915]'
  if (r === 'user' || r === '0') return 'ring-2 ring-[#0c8de6]'
  return ''
}

/**
 * Normalize a raw role value to a RoleType string.
 */
function normalizeRoleType(role: string | number | undefined | null): RoleType {
  const r = String(role ?? '').toLowerCase()
  if (r === 'nutritionist' || r === '3') return 'nutritionist'
  if (r === 'trainer' || r === '1') return 'trainer'
  return 'user'
}

/**
 * Get accent colors for a specific author role (for fallback avatars).
 * Similar to getAccentColors but takes a raw role value.
 */
export function getAccentColorsByRole(role: string | number | undefined | null) {
  return getAccentColors(normalizeRoleType(role))
}
