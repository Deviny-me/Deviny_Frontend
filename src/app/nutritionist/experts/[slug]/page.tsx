'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { API_URL, fetchWithAuth } from '@/lib/config'

export default function NutritionistExpertProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/trainers/${slug}/profile`)
        if (res.ok) {
          const data = await res.json()
          router.replace(`/nutritionist/profile/${data.trainer.userId}`)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      }
    })()
  }, [slug, router])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[#28bf68] animate-spin" />
    </div>
  )
}
