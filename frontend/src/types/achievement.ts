// ── Achievement types ──

export interface AchievementDto {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  colorKey: string;
  rarity: string; // Common | Rare | Epic | Legendary
  xpReward: number;
  targetRole: string | null;
  isUnlocked: boolean;
  awardedAt: string | null;
}

export interface MyAchievementsResponse {
  all: AchievementDto[];
  unlockedCount: number;
  totalCount: number;
}

// ── Achievement awarded (SignalR push) ──

export interface AchievementAwardedEvent {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  colorKey: string;
  rarity: string;
  xpReward: number;
}

// ── Challenge types ──

export interface ChallengeDto {
  id: string;
  code: string;
  title: string;
  description: string;
  type: string; // OneTime | Counter | Streak
  targetValue: number;
  targetRole: string | null;
  achievementTitle: string | null;
  achievementIconKey: string | null;
  achievementColorKey: string | null;
}

export interface UserChallengeProgressDto {
  challenge: ChallengeDto;
  currentValue: number;
  targetValue: number;
  status: string; // Active | Completed | Expired
  completedAt: string | null;
  progressPercent: number;
}

export interface MyChallengesResponse {
  challenges: UserChallengeProgressDto[];
  completedCount: number;
  totalCount: number;
}
