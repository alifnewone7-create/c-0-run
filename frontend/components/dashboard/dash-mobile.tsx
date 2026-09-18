'use client'

import Image from 'next/image'
import { BadgeCheck, PocketKnife } from 'lucide-react'
import { useAuth, type UserProfile } from '@/components/auth-provider'
import { TIER_LABEL } from '@/lib/tiers'

export function DashMobileHeader({ profile, onProfile }: { profile: UserProfile; onProfile: () => void }) {
  const { tier } = useAuth()
  return (
    <header className="dsh-mhead md:hidden" data-testid="dash-mobile-header">
      <button type="button" onClick={onProfile} aria-label="Open profile card" className="dsh-mhead-avatar" data-testid="mobile-avatar-btn">
        <Image src="/coco-profile.png" alt={profile.name} width={52} height={52} className="h-full w-full rounded-[15px] object-cover" priority />
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[16px] font-semibold leading-tight text-white" data-testid="mobile-header-name">
          <span className="truncate">{profile.name}</span>
          {tier !== 'free' && <BadgeCheck className="h-4 w-4 flex-none text-[#b48cff]" />}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-white/55" data-testid="mobile-header-email">{profile.email}</p>
      </div>
      <span className="dsh-tier-chip" data-testid="mobile-header-tier">{TIER_LABEL[tier]}</span>
    </header>
  )
}

export function DashMascot({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="dsh-mascot md:hidden" data-testid="dash-mascot">
      <div className="dsh-mascot-stage">
        <span className="dsh-mascot-halo" aria-hidden="true" />
        <Image
          src="/dash/mascot-v3.webp"
          alt="Coco AI mascot"
          width={726}
          height={1100}
          className="dsh-mascot-img"
          priority
          sizes="(max-width: 767px) 62vw, 320px"
        />
        <span className="dsh-mascot-shadow" aria-hidden="true" />
      </div>
      <button type="button" onClick={onOpen} className="coco-btn coco-btn-primary dsh-open-tools" data-testid="open-tools-btn">
        <PocketKnife className="h-4 w-4" />
        Open tools
      </button>
      <p className="coco-mono mt-3 text-[9.5px] uppercase tracking-[0.16em] text-white/40">6 AI desks · one console</p>
    </section>
  )
}
