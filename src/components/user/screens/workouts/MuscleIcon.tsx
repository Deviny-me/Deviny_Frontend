import type { MuscleGroup } from '@/types/workout'
import { cn } from '@/lib/utils/cn'

interface MuscleIconProps {
  muscle: MuscleGroup
  className?: string
}

/**
 * Compact custom SVG icons for each muscle group used in filters / chips.
 * Stroke-based, picks up `currentColor` from the surrounding chip.
 */
export function MuscleIcon({ muscle, className }: MuscleIconProps) {
  const base = cn('h-3.5 w-3.5 shrink-0', className)
  const common = {
    className: base,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (muscle) {
    case 'chest':
      // Pectoral silhouette
      return (
        <svg {...common}>
          <path d="M3 8c2.5-2 6-3 9-3s6.5 1 9 3" />
          <path d="M12 5v6" />
          <path d="M3 8c0 4 2 8 5 8 2 0 4-2 4-5" />
          <path d="M21 8c0 4-2 8-5 8-2 0-4-2-4-5" />
        </svg>
      )
    case 'back':
      // V-shape back
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <path d="M5 6l7 4 7-4" />
          <path d="M5 12l7 3 7-3" />
          <path d="M7 18l5 2 5-2" />
        </svg>
      )
    case 'shoulders':
      // Deltoid rounded curves
      return (
        <svg {...common}>
          <path d="M3 14c1.5-5 4-7 6-7" />
          <path d="M21 14c-1.5-5-4-7-6-7" />
          <circle cx="12" cy="9" r="3" />
          <path d="M9 14h6" />
        </svg>
      )
    case 'biceps':
      // Flexed arm
      return (
        <svg {...common}>
          <path d="M4 17c0-5 3-8 7-8" />
          <path d="M11 9c2 0 4 1.5 4 4 0 2-1.5 3-3 3" />
          <path d="M9 13c1.5-1 3-1 4 0" />
          <path d="M11 9V5" />
        </svg>
      )
    case 'triceps':
      // Back-arm horseshoe
      return (
        <svg {...common}>
          <path d="M6 6c3-1 6-1 9 1" />
          <path d="M15 7c2 2 3 5 2 8" />
          <path d="M17 15c-2 2-5 3-8 2" />
          <path d="M9 17c-2-1-3-3-3-6" />
          <path d="M11 11l2 2" />
        </svg>
      )
    case 'forearms':
      // Forearm with grip
      return (
        <svg {...common}>
          <rect x="4" y="10" width="14" height="4" rx="2" />
          <path d="M18 12h3" />
          <path d="M7 14v3" />
          <path d="M11 14v3" />
          <path d="M15 14v3" />
        </svg>
      )
    case 'core':
      // Six-pack grid
      return (
        <svg {...common}>
          <rect x="6" y="4" width="12" height="16" rx="3" />
          <path d="M12 4v16" />
          <path d="M6 9h12" />
          <path d="M6 14h12" />
        </svg>
      )
    case 'quads':
      // Front thigh
      return (
        <svg {...common}>
          <path d="M9 3v7c0 2-1 4-2 7l2 4" />
          <path d="M15 3v7c0 2 1 4 2 7l-2 4" />
          <path d="M9 10h6" />
          <circle cx="12" cy="5" r="1" />
        </svg>
      )
    case 'hamstrings':
      // Back of leg
      return (
        <svg {...common}>
          <path d="M8 3c0 4-1 7-3 11l3 7" />
          <path d="M16 3c0 4 1 7 3 11l-3 7" />
          <path d="M9 14h6" />
          <path d="M9 18h6" />
        </svg>
      )
    case 'glutes':
      // Two rounded shapes
      return (
        <svg {...common}>
          <path d="M4 12c0-4 3-7 7-7s4 3 4 5-1 4-3 5-3 3-5 3-3-2-3-6z" />
          <path d="M20 12c0-4-3-7-7-7" opacity="0" />
          <path d="M12 5c4 0 8 3 8 7s-1 7-4 7-3-2-5-3-3-3-3-5 0-6 4-6z" />
        </svg>
      )
    case 'calves':
      // Calf curve
      return (
        <svg {...common}>
          <path d="M10 3v6c0 2 .5 4 1.5 6L13 21" />
          <path d="M14 3v6c0 2-.5 4-1.5 6L11 21" />
          <path d="M9 9c2-1 4-1 6 0" />
        </svg>
      )
    case 'fullBody':
      // Stick figure
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v8" />
          <path d="M6 10l6 2 6-2" />
          <path d="M12 15l-3 6" />
          <path d="M12 15l3 6" />
        </svg>
      )
    case 'cardio':
      // Heart with pulse line
      return (
        <svg {...common}>
          <path d="M3 12h3l2-4 3 8 2-6 2 4 2-2h4" />
        </svg>
      )
    default:
      return null
  }
}
