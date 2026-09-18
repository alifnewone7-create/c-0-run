'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, type UserProfile } from '@/components/auth-provider'
import { CocoLoading } from '@/components/coco/coco-loading'

export function AuthGuard({
  children,
}: {
  children: (profile: UserProfile) => React.ReactNode
}) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user || !profile) {
    return <CocoLoading />
  }

  return <>{children(profile)}</>
}
