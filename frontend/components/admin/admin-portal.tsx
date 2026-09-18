'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminLogin } from '@/components/admin/admin-login'
import { CocoLoading } from '@/components/coco/coco-loading'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

const ADMIN_FLAG = 'sx_admin_authed'

function readAdminFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ADMIN_FLAG) === '1'
  } catch {
    return false
  }
}

export function AdminPortal() {
  // Optimistically trust the localStorage flag so a returning admin sees the
  // dashboard instantly (no login flash). The httpOnly cookie is still the
  // source of truth and is verified in the background below.
  const [authed, setAuthed] = useState<boolean | null>(() =>
    readAdminFlag() ? true : null,
  )

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { cache: 'no-store' })
      const data = (await res.json()) as { authed?: boolean }
      const ok = Boolean(data.authed)
      setAuthed(ok)
      try {
        if (ok) window.localStorage.setItem(ADMIN_FLAG, '1')
        else window.localStorage.removeItem(ADMIN_FLAG)
      } catch {
        // ignore storage errors
      }
    } catch {
      setAuthed(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (authed === null) {
    return <CocoLoading label="Loading portal..." />
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  return (
    <AdminDashboard
      onLogout={() => {
        try {
          window.localStorage.removeItem(ADMIN_FLAG)
        } catch {
          // ignore storage errors
        }
        setAuthed(false)
      }}
    />
  )
}
