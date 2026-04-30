export interface UserLevelDto {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  requiredXpForNextLevel: number;
  progressPercent: number;
  lifetimeXp: number;
  levelTitle: string | null;
  nextLevelTitle: string | null;
}
