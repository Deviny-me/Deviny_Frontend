'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { Trophy } from 'lucide-react'

interface LevelBadgeProps {
  className?: string
  showTitle?: boolean
}

export function LevelBadge({ className = '', showTitle = true }: LevelBadgeProps) {
  const { level, loading } = useLevel()

  if (loading) {
    return (
      <div className={`flex items-center gap-2 animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  if (!level) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Level Circle */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">{level.currentLevel}</span>
        </div>
        <Trophy className="absolute -top-1 -right-1 w-4 h-4 text-amber-500" />
      </div>

      {/* Level Info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-foreground">
            Уровень {level.currentLevel}
          </span>
          {showTitle && level.levelTitle && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {level.levelTitle}
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-faint-foreground dark:text-muted-foreground whitespace-nowrap">
            {level.currentXp}/{level.requiredXpForNextLevel} XP
          </span>
        </div>
      </div>
    </div>
  )
}
