/**
 * Shared style strings for the auth flow.
 * Premium, token-driven look used by login / register / forgot-password / role picker.
 */
import { cn } from '@/lib/utils/cn'

/** Frosted, hairline-bordered card that floats over the auth backdrop. */
export const authCard = cn(
  'relative bg-surface-1/80 dark:bg-surface-1/60',
  'backdrop-blur-2xl backdrop-saturate-150',
  'rounded-3xl ring-1 ring-inset ring-border-subtle',
  'shadow-lg shadow-black/[0.04] dark:shadow-black/30',
  'p-6 sm:p-8',
)

/** Inputs used across auth (kept separate from <Input/> primitive so existing markup with show-password buttons keeps working). */
export const authInputBase = cn(
  'w-full px-4 py-3.5 rounded-xl',
  'bg-surface-2 text-foreground placeholder:text-faint-foreground',
  'ring-1 ring-inset ring-border',
  'transition-[box-shadow,background-color,color] duration-200 ease-out-expo',
  'hover:ring-border-strong',
  'focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:bg-surface-1',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const authInputOk = ''
export const authInputErr = 'ring-red-500/60 focus:ring-red-500/70 hover:ring-red-500/60'

/** Field label */
export const authLabel = 'block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2'

/** Inline form-level error message */
export const authErrorBox = cn(
  'mb-5 flex items-center gap-3 p-4 rounded-2xl text-sm',
  'bg-red-500/10 ring-1 ring-inset ring-red-500/20 text-red-600 dark:text-red-300',
)

/** Field-level error text */
export const authFieldError = 'mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5'

/** Native <select> styled like inputs (used in register). */
export const authSelectBase = cn(
  'w-full h-[54px] px-4 rounded-xl',
  'bg-surface-2 text-foreground appearance-none',
  'ring-1 ring-inset ring-border',
  'transition-[box-shadow,background-color] duration-200 ease-out-expo',
  'hover:ring-border-strong',
  'focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] focus:bg-surface-1',
)

/** Top accent line shown atop role-themed cards. */
export const authAccentLine = (gradient: string) =>
  cn('absolute top-0 left-8 right-8 h-px rounded-full bg-gradient-to-r opacity-80', gradient)

/** Per-role visual config consumed by login/register/forgot-password. */
export const authRoleConfig = {
  user: {
    iconBg:
      'bg-gradient-to-br from-user-100 to-user-200 dark:from-user-500/20 dark:to-user-600/20 ring-1 ring-inset ring-user-500/20',
    iconColor: 'text-user-600 dark:text-user-300',
    gradientLine: 'from-user-400 via-user-500 to-user-600',
  },
  trainer: {
    iconBg:
      'bg-gradient-to-br from-trainer-100 to-trainer-200 dark:from-trainer-500/20 dark:to-trainer-600/20 ring-1 ring-inset ring-trainer-500/20',
    iconColor: 'text-trainer-600 dark:text-trainer-300',
    gradientLine: 'from-trainer-400 via-trainer-500 to-trainer-600',
  },
  nutritionist: {
    iconBg:
      'bg-gradient-to-br from-nutritionist-100 to-nutritionist-200 dark:from-nutritionist-500/20 dark:to-nutritionist-600/20 ring-1 ring-inset ring-nutritionist-500/20',
    iconColor: 'text-nutritionist-600 dark:text-nutritionist-300',
    gradientLine: 'from-nutritionist-400 via-nutritionist-500 to-nutritionist-600',
  },
} as const
