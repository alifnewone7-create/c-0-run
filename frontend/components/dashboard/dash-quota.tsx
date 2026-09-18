'use client'

import { useState } from 'react'
import { ArrowRight, KeyRound, Lock } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { FEATURES, FEATURE_LABEL, TIER_LABEL, QUOTA_RESET_NOTE, type FeatureKey } from '@/lib/tiers'
import {
  GlyphTier,
  GlyphQuota,
  GlyphOrbit,
  GlyphPulseLive,
  GlyphInjector,
  GlyphInfinite,
  GlyphClockRing,
} from '@/components/dashboard/dash-glyphs'
import { GlyphOtcPrism, GlyphRealPulse } from '@/components/analyzer-glyphs'

type Glyph = ({ className }: { className?: string }) => React.ReactElement

const FEATURE_GLYPH: Record<FeatureKey, Glyph> = {
  'otc-chart-analyzer': GlyphOtcPrism,
  'real-chart-analyzer': GlyphRealPulse,
  'future-signals': GlyphOrbit,
  'live-signals': GlyphPulseLive,
  injector: GlyphInjector,
}

const FEATURE_TONE: Record<FeatureKey, { light: string; dark: string }> = {
  'otc-chart-analyzer': { light: '#b48cff', dark: '#6d3bff' },
  'real-chart-analyzer': { light: '#6ddcae', dark: '#189a72' },
  'future-signals': { light: '#f3c775', dark: '#c2820f' },
  'live-signals': { light: '#8fb8ff', dark: '#3b62d8' },
  injector: { light: '#f0a3ff', dark: '#b13fd6' },
}

export function DashQuota() {
  const { loading, tier, hasAccess, isUnlimited, limit, usage } = useAuth()
  const [noteOpen, setNoteOpen] = useState(false)

  return (
    <section id="tier" className="dsh-tier" data-testid="dashboard-tier">
      <div className="text-center">
        <span className="coco-eyebrow">
          <GlyphTier className="h-3.5 w-3.5" />
          Access tier
        </span>
        <h2 className="coco-display coco-title-gradient mx-auto mt-4 max-w-[24ch] text-balance text-[1.6rem] sm:text-[2.3rem] lg:text-[2.6rem]">
          Your plan and daily engine quota.
        </h2>
        <span className="dsh-tier-rule" aria-hidden="true" data-testid="tier-headline-rule" />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="coco-shade relative overflow-hidden rounded-[24px] p-5 sm:p-6" data-testid="tier-plan-card">
          <span className="coco-d2-hero-line" aria-hidden="true" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex items-center gap-3.5">
              <span className="coco-d2-meta-icon h-12 w-12 flex-none rounded-[15px]">
                <GlyphTier className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="coco-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">Current plan</p>
                <p className="coco-sub text-[21px] leading-tight text-white sm:text-[24px]" data-testid="tier-plan-name">
                  {TIER_LABEL[tier]}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-white/10 lg:hidden" aria-hidden="true" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 lg:flex-none">
              <button
                type="button"
                onClick={() => setNoteOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-left text-[12.5px] text-white/70 transition-colors hover:border-white/25 hover:text-white"
                data-testid="tier-reset-toggle"
              >
                <GlyphClockRing className="h-4 w-4 flex-none text-[#c4a6ff]" />
                Resets daily at 6:00 AM (BST)
              </button>
              <a
                href="https://t.me/Ayan_Dead"
                target="_blank"
                rel="noopener noreferrer"
                className="coco-btn coco-btn-primary w-full sm:w-auto"
                data-testid="tier-upgrade-link"
              >
                <KeyRound className="h-4 w-4" />
                {hasAccess ? 'Upgrade licence' : 'Unlock access'}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          {noteOpen && <p className="mt-3 text-[12px] leading-relaxed text-white/55">{QUOTA_RESET_NOTE}</p>}
        </div>

        <div className="dsh-quota" data-testid="dashboard-quota">
          <div className="dsh-panel-head">
            <span className="dsh-panel-icon">
              <GlyphQuota className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="coco-sub text-[17px] text-[var(--ink)] sm:text-[19px]">Daily quota</h3>
              <p className="coco-muted mt-0.5 text-[12.5px]">
                {hasAccess
                  ? `Live consumption across your five generation tools · ${isUnlimited ? 'unlimited' : `${limit} per tool`}`
                  : 'Generating results stays locked on the Free plan.'}
              </p>
            </div>
          </div>

          <div className="my-5 h-px w-full bg-gradient-to-r from-[#d8c9ff] via-[var(--hairline)] to-transparent" />

          {!hasAccess && !loading && (
            <a
              href="https://t.me/Ayan_Dead"
              target="_blank"
              rel="noopener noreferrer"
              className="dsh-unlock mb-4"
              data-testid="quota-unlock-link"
            >
              <span className="dsh-unlock-icon">
                <KeyRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-white">Unlock your licence</span>
                <span className="block text-[12px] text-white/60">Every tool below opens with a daily allowance.</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-[#c4a6ff]" />
            </a>
          )}

          <ul className="dsh-gauge-grid">
            {FEATURES.map((feature) => (
              <GaugeCard
                key={feature}
                feature={feature}
                used={usage[feature] || 0}
                limit={limit}
                unlimited={isUnlimited}
                locked={!hasAccess}
                loading={loading}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const ARC = 'M 20.2 83 A 46 46 0 1 1 99.8 83'

function GaugeCard({
  feature,
  used,
  limit,
  unlimited,
  locked,
  loading,
}: {
  feature: FeatureKey
  used: number
  limit: number | null
  unlimited: boolean
  locked: boolean
  loading: boolean
}) {
  const Glyph = FEATURE_GLYPH[feature]
  const tone = FEATURE_TONE[feature]
  const remaining = unlimited || limit === null ? null : Math.max(0, limit - used)
  const pct = loading || locked || unlimited || !limit ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const depleted = !locked && remaining !== null && remaining <= 0
  const gid = `g-${feature}`

  return (
    <li
      className="dsh-gauge"
      style={{ '--t-light': tone.light, '--t-dark': tone.dark } as React.CSSProperties}
      data-testid={`quota-gauge-${feature}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="dsh-gauge-icon">
          <Glyph className="h-[16px] w-[16px]" />
        </span>
        <p className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{FEATURE_LABEL[feature]}</p>
      </div>

      <div className="dsh-gauge-arc">
        <svg viewBox="0 0 120 92" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={depleted ? '#d1435b' : tone.dark} />
              <stop offset="100%" stopColor={depleted ? '#f19aa6' : tone.light} />
            </linearGradient>
          </defs>
          <path d={ARC} className="dsh-gauge-track" pathLength={100} />
          <path
            d={ARC}
            className="dsh-gauge-fill"
            pathLength={100}
            stroke={`url(#${gid})`}
            strokeDasharray={`${pct} 100`}
            style={{ opacity: pct > 0 ? 1 : 0 }}
          />
        </svg>
        <div className="dsh-gauge-center">
          {locked ? (
            <Lock className="h-6 w-6 text-[#9a9aa3]" />
          ) : unlimited ? (
            <GlyphInfinite className="h-8 w-8" />
          ) : (
            <span className="dsh-gauge-num" data-testid={`quota-used-${feature}`}>
              {loading ? '—' : used}
            </span>
          )}
          <span className="coco-mono text-[8.5px] uppercase tracking-[0.16em] text-[#9a9aa3]">
            {locked ? 'locked' : unlimited ? 'unlimited' : `of ${limit} used`}
          </span>
        </div>
      </div>

      <p className="dsh-gauge-foot">
        {locked
          ? 'Upgrade to unlock'
          : unlimited
            ? 'No daily cap'
            : depleted
              ? 'Daily limit reached'
              : `${remaining} left today`}
      </p>
    </li>
  )
}
