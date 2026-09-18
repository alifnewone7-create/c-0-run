'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, BadgeCheck, Check, Copy, Mail, PocketKnife } from 'lucide-react'
import { useAuth, type UserProfile } from '@/components/auth-provider'
import { TIER_LABEL } from '@/lib/tiers'

export function DashDesktopHero({
  profile,
  onOpenTools,
  onProfile,
}: {
  profile: UserProfile
  onOpenTools: () => void
  onProfile: () => void
}) {
  const { tier, hasAccess, isUnlimited, limit } = useAuth()
  const [copied, setCopied] = useState(false)
  const verified = tier !== 'free'

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  return (
    <section className="dsh-hero hidden md:block" data-testid="dash-desktop-hero">
      <div className="dsh-hero-frame">
        <div className="dsh-hero-banner">
          <Image src="/dash/hero-bullbear-v2.webp" alt="" width={1856} height={576} className="dsh-hero-art" priority sizes="(min-width: 1280px) 1400px, 100vw" />
          <span className="dsh-hero-shade" aria-hidden="true" />
          <span className="dsh-hero-tick dsh-hero-tick-tl" aria-hidden="true" />
          <span className="dsh-hero-tick dsh-hero-tick-tr" aria-hidden="true" />
          <div className="dsh-hero-actions">
            <button type="button" onClick={onOpenTools} className="coco-btn coco-btn-primary" data-testid="desktop-open-tools-btn">
              <PocketKnife className="h-4 w-4" />
              Open tools
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="dsh-hero-strip">
          <dl className="dsh-hero-stats">
            <Stat label="Plan" value={TIER_LABEL[tier]} />
            <Stat label="Daily limit" value={!hasAccess ? 'Locked' : isUnlimited ? '∞' : `${limit} / tool`} />
          </dl>

          <div className="dsh-hero-ident">
            <button type="button" onClick={onProfile} className="dsh-hero-avatar" aria-label="Open profile card" data-testid="desktop-avatar-btn">
              <Image src="/coco-profile.png" alt={profile.name} width={112} height={112} className="h-full w-full rounded-[22px] object-cover" />
            </button>
            <p className="dsh-hero-name" data-testid="desktop-hero-name">
              <span className="truncate">{profile.name}</span>
              {verified && <BadgeCheck className="h-[18px] w-[18px] flex-none text-[#b48cff]" data-testid="desktop-verified-icon" />}
            </p>
          </div>

          <div className="dsh-hero-contact">
            <button type="button" onClick={copyEmail} className="dsh-hero-email" data-testid="desktop-copy-email">
              <Mail className="h-4 w-4 text-[#c4a6ff]" />
              <span className="truncate">{profile.email}</span>
              {copied ? <Check className="h-4 w-4 text-[#8ef0c4]" /> : <Copy className="h-4 w-4 text-white/45" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="dsh-hero-stat">
      <dt className="coco-mono text-[9px] uppercase tracking-[0.16em] text-white/40">{label}</dt>
      <dd className="mt-1 text-[17px] font-semibold text-white">{value}</dd>
    </div>
  )
}
