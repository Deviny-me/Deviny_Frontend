'use client'

import { ComingSoonPage } from '@/components/shared/ComingSoonPage'
import { Trophy, Users, Zap } from 'lucide-react'

export default function ChallengesPage() {
  return (
    <ComingSoonPage
      icon={Trophy}
      ns="challenges"
      features={[
        { icon: Trophy, titleKey: 'weeklyChallenge', descKey: 'weeklyChallengeDesc' },
        { icon: Users, titleKey: 'teamCompetitions', descKey: 'teamCompetitionsDesc' },
        { icon: Zap, titleKey: 'streakChallenges', descKey: 'streakChallengesDesc' },
      ]}
    />
  )
}
