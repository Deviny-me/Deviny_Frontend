import { Spinner } from '@/components/ui/Spinner'

export default function UserLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner size="lg" color="user" />
    </div>
  )
}
