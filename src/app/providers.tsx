'use client'

import { AuthProvider } from '@/features/auth/AuthContext'
import { PostStoreProvider } from '@/contexts/PostStoreContext'
import { RouteProgressBar } from '@/components/ui/RouteProgressBar'
import { ReactNode, Suspense } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PostStoreProvider>
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
      </PostStoreProvider>
    </AuthProvider>
  )
}
