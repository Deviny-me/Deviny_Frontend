import { WorkoutSessionScreen } from '@/components/user/screens/workouts'

interface PageProps {
  params: { sessionId: string }
}

export default function WorkoutSessionPage({ params }: PageProps) {
  return <WorkoutSessionScreen sessionId={params.sessionId} />
}
