import { Spinner } from '@/components/ui/Spinner'

export default function AuthLoginLoading() {
  return (
    <div className="w-full flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" color="primary" />
    </div>
  )
}
