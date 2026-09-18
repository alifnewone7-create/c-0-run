'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { BadgeCheck, Check, Copy, LogOut, Mail, X } from 'lucide-react'
import { useAuth, type UserProfile } from '@/components/auth-provider'
import { GlyphTier } from '@/components/dashboard/dash-glyphs'
import { TIER_LABEL, TIER_DAILY_LIMIT } from '@/lib/tiers'
import { cn } from '@/lib/utils'

export function DashProfileSheet({
  profile,
  open,
  onClose,
}: {
  profile: UserProfile
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { tier, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [copied, setCopied] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ startY: 0, dy: 0, active: false })

  useEffect(() => setMounted(true), [])

  function onDragStart(e: React.PointerEvent) {
    if (window.innerWidth >= 768) return
    drag.current = { startY: e.clientY, dy: 0, active: true }
    sheetRef.current?.classList.add('is-dragging')
  }
  function onDragMove(e: React.PointerEvent) {
    if (!drag.current.active || !sheetRef.current) return
    const dy = Math.max(0, e.clientY - drag.current.startY)
    drag.current.dy = dy
    sheetRef.current.style.transform = `translate3d(0, ${dy}px, 0)`
  }
  function onDragEnd() {
    if (!drag.current.active || !sheetRef.current) return
    drag.current.active = false
    const el = sheetRef.current
    el.classList.remove('is-dragging')
    el.classList.add('is-settled')
    if (drag.current.dy > 110) {
      el.style.transform = 'translate3d(0, 110%, 0)'
      close()
    } else {
      el.style.transform = ''
    }
  }

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 180)
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  if (!mounted || !open) return null

  const verified = tier !== 'free'
  const limit = TIER_DAILY_LIMIT[tier]

  return createPortal(
    <div className="coco dsh-sheet-root" role="dialog" aria-modal="true" aria-label="Profile card">
      <button
        type="button"
        aria-label="Close profile"
        onClick={close}
        className={cn('dsh-backdrop', closing && 'is-closing')}
        data-testid="profile-sheet-backdrop"
      />
      <div
        ref={sheetRef}
        className={cn('dsh-sheet', closing && 'is-closing')}
        data-testid="profile-sheet"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="dsh-sheet-banner">
          <span className="dsh-sheet-banner-shape a" aria-hidden="true" />
          <span className="dsh-sheet-banner-shape b" aria-hidden="true" />
          <span className="dsh-sheet-grab md:hidden" aria-hidden="true" />
          <button type="button" onClick={close} aria-label="Close" className="dsh-sheet-close" data-testid="profile-sheet-close">
            <X className="h-4 w-4" />
          </button>
          {verified && (
            <span className="dsh-verified-pill" data-testid="profile-verified-pill">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>

        <div className="dsh-sheet-body">
          <span className="dsh-sheet-avatar">
            <Image src="/coco-profile.png" alt={profile.name} width={96} height={96} className="h-full w-full rounded-[20px] object-cover" />
          </span>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h2 className="coco-display text-[24px] leading-none text-white" data-testid="profile-sheet-name">
              {profile.name}
            </h2>
            {verified && <BadgeCheck className="h-5 w-5 flex-none text-[#b48cff]" data-testid="profile-sheet-verified-icon" />}
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <div className="dsh-info-row" data-testid="profile-sheet-email-card">
              <span className="dsh-info-icon">
                <Mail className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="coco-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">Email</p>
                <p className="truncate text-[13.5px] text-white/90" data-testid="profile-sheet-email">{profile.email}</p>
              </div>
              <button type="button" onClick={copyEmail} aria-label="Copy email" className="dsh-info-action" data-testid="profile-sheet-copy">
                {copied ? <Check className="h-4 w-4 text-[#8ef0c4]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="dsh-info-row" data-testid="profile-sheet-tier-card">
              <span className="dsh-info-icon is-tier">
                <GlyphTier className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="coco-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">Account tier</p>
                <p className="text-[13.5px] text-white/90">
                  {TIER_LABEL[tier]} plan
                  <span className="text-white/45">
                    {' '}· {limit === null ? 'unlimited' : limit === 0 ? 'locked' : `${limit} / tool / day`}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleLogout} className="dsh-sheet-logout" data-testid="profile-sheet-logout">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
