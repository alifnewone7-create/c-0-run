'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shared log-out confirmation dialog (mobile + desktop). */
export function LogoutConfirm({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}) {
  const [mounted, setMounted] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    setBusy(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!mounted || !open) return null

  async function confirm() {
    setBusy(true)
    await onConfirm()
  }

  return createPortal(
    <div className="coco lgc-root" role="dialog" aria-modal="true" aria-labelledby="lgc-title">
      <button
        type="button"
        aria-label="Cancel log out"
        onClick={() => !busy && onCancel()}
        className="lgc-backdrop"
        data-testid="logout-confirm-backdrop"
      />
      <div className="lgc-card" data-testid="logout-confirm">
        <span className="lgc-icon" aria-hidden="true">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h2 id="lgc-title" className="coco-display lgc-title" data-testid="logout-confirm-title">
          Log out of Coco AI?
        </h2>
        <p className="lgc-copy">
          Your session on this device will end. You&apos;ll need to sign in again to reach the
          signal engines.
        </p>
        <div className="lgc-actions">
          <button
            type="button"
            onClick={() => onCancel()}
            disabled={busy}
            className="lgc-btn lgc-btn-ghost"
            data-testid="logout-cancel"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={cn('lgc-btn lgc-btn-danger', busy && 'is-busy')}
            data-testid="logout-confirm-btn"
          >
            <LogOut className="h-4 w-4" />
            {busy ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
