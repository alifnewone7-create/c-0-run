'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, AUTH_STORAGE_KEY } from '@/components/auth-provider'
import { CocoLoading } from '@/components/coco/coco-loading'

/**
 * Wraps the login / registration pages. If the user is already authenticated
 * they are sent straight to the dashboard. A synchronous localStorage check
 * lets us show a loader immediately for returning users, so the auth form is
 * never flashed for even a fraction of a second before the redirect.
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [hadSession] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  if (user || (hadSession && loading)) {
    return <CocoLoading />
  }

  return <>{children}</>
}
