'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import {
  X,
  Orbit,
  WalletCards,
  Headset,
  ArrowRight,
  ChevronLeft,
  Infinity as InfinityIcon,
  Rocket,
  UserRoundPlus,
  CircleDollarSign,
  BadgeCheck,
  KeyRound,
  Check,
  Hourglass,
  Clock3,
  Crown,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { useSheetDrag } from '@/components/coco/use-sheet-drag'
import { FEATURE_LABEL, type FeatureKey } from '@/lib/tiers'

const ADMIN_URL = 'https://t.me/Ayan_Dead'
const BROKER_URL = 'https://market-qx.pro/sign-up/?lid=619650'

type GateReason = 'locked' | 'limit'
type GatePayload = { reason: GateReason; feature?: FeatureKey; message?: string }
type View = 'locked' | 'plans' | 'limit'

type UpgradeGateContextValue = { open: (payload: GatePayload) => void }
const UpgradeGateContext = createContext<UpgradeGateContextValue | undefined>(undefined)

const PERKS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: InfinityIcon, title: 'Daily signal engine', desc: 'Live, Future, Injector and both chart analyzers.' },
  { icon: Rocket, title: 'Instant activation', desc: 'Your plan switches on within minutes of verification.' },
  { icon: Headset, title: 'Priority desk', desc: 'Direct support line for members, every day.' },
]

const FREE_STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserRoundPlus, title: 'Create account', desc: 'Register your trading account through our exclusive partner link.' },
  { icon: CircleDollarSign, title: 'Fund balance', desc: 'A minimum of $50 in trading capital activates your access.' },
  { icon: BadgeCheck, title: 'Verify UID', desc: 'Send your UID to the support desk for instant verification.' },
]

const LICENSE_PERKS = [
  'Skip broker registration entirely',
  'Direct, unrestricted engine access',
  'One month full plan, instant activation',
  'Priority support channel included',
]

export function UpgradeGateProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<GatePayload | null>(null)
  const [view, setView] = useState<View>('locked')

  const open = useCallback((next: GatePayload) => {
    setView(next.reason === 'limit' ? 'limit' : 'locked')
    setPayload(next)
  }, [])
  const close = useCallback(() => setPayload(null), [])

  return (
    <UpgradeGateContext.Provider value={{ open }}>
      {children}
      {payload && <GateSheet payload={payload} view={view} setView={setView} onClose={close} />}
    </UpgradeGateContext.Provider>
  )
}

function GateSheet({
  payload,
  view,
  setView,
  onClose,
}: {
  payload: GatePayload
  view: View
  setView: (v: View) => void
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const { ref, handlers } = useSheetDrag(onClose)

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(onClose, 180)
  }, [onClose])

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [close])

  if (!mounted) return null

  const featureLabel = payload.feature ? FEATURE_LABEL[payload.feature] : null

  return createPortal(
    <div className={`coco ug-root${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="upgrade-title" data-testid="upgrade-gate">
      <button type="button" aria-label="Close" onClick={close} className="ug-backdrop" data-testid="upgrade-gate-backdrop" />
      <div ref={ref} className="ug-sheet coco-light" data-view={view} data-testid="upgrade-gate-sheet" {...handlers}>
        <div className="ug-head" data-drag-handle>
          <span className="ug-grab" aria-hidden="true" />
          <div className="ug-head-row">
            {view === 'plans' ? (
              <button type="button" onClick={() => setView('locked')} className="ug-back" data-testid="upgrade-gate-back">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span className="coco-eyebrow">
                {view === 'limit' ? <Hourglass className="h-3 w-3" /> : <Orbit className="h-3 w-3" />}
                {view === 'limit' ? 'Daily quota' : 'Coco engine'}
              </span>
            )}
            <button type="button" onClick={close} aria-label="Close dialog" className="ug-close" data-testid="upgrade-gate-close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === 'locked' && <LockedView featureLabel={featureLabel} message={payload.message} onPlans={() => setView('plans')} />}
        {view === 'plans' && <PlansView />}
        {view === 'limit' && <LimitView featureLabel={featureLabel} />}
      </div>
    </div>,
    document.body,
  )
}

function LockedView({ featureLabel, message, onPlans }: { featureLabel: string | null; message?: string; onPlans: () => void }) {
  return (
    <div className="ug-body" data-testid="upgrade-gate-locked">
      <div className="ug-logo" aria-hidden="true">
        <span className="ug-logo-ring" />
        <span className="ug-logo-img">
          <Image src="/coco-ai.jpg" alt="Coco AI" fill sizes="72px" className="object-cover" />
        </span>
      </div>
      <h2 id="upgrade-title" className="coco-display coco-title-gradient ug-title" data-testid="upgrade-gate-title">
        Unlock your engine.
      </h2>
      <p className="coco-muted ug-lead">
        {message ??
          `Your Free account can explore every page. Generating results with ${featureLabel ?? 'the tools'} is reserved for members.`}
      </p>

      <ul className="ug-perks">
        {PERKS.map((p, i) => (
          <li key={p.title} className="ug-perk coco-card" style={{ '--d': `${80 + i * 60}ms` } as React.CSSProperties}>
            <span className="coco-icon h-10 w-10 shrink-0">
              <p.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <b className="coco-sub">{p.title}</b>
              <em className="coco-muted">{p.desc}</em>
            </span>
          </li>
        ))}
      </ul>

      <div className="ug-actions">
        <button type="button" onClick={onPlans} className="coco-btn coco-btn-primary w-full" data-testid="upgrade-gate-view-plans">
          <WalletCards className="h-4 w-4" />
          View Plans
          <ArrowRight className="h-4 w-4" />
        </button>
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="coco-btn coco-btn-ghost w-full" data-testid="upgrade-gate-contact-admin">
          <Headset className="h-4 w-4" />
          Contact Admin
        </a>
      </div>
    </div>
  )
}

function PlansView() {
  return (
    <div className="ug-body ug-body-plans" data-testid="upgrade-gate-plans">
      <div className="ug-plans-head">
        <span className="coco-eyebrow">
          <Layers className="h-3 w-3" />
          Access paths
        </span>
        <h2 id="upgrade-title" className="coco-display coco-title-gradient ug-title" data-testid="upgrade-gate-plans-title">
          Two ways in. Same engine.
        </h2>
        <p className="coco-muted ug-lead">Earn free access through our partner broker, or take a direct plan and skip the setup completely.</p>
      </div>

      <div className="ug-plans">
        <article className="coco-card ug-plan" data-testid="upgrade-plan-free">
          <h3 className="coco-sub flex flex-wrap items-center justify-center gap-2 text-xl">
            <span>Free access</span>
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#c9b6ff]" />
            <span className="coco-free-price">$0</span>
            <span>forever</span>
          </h3>
          <p className="coco-muted mt-2 text-center text-sm">Three steps and the engine unlocks at no cost.</p>
          <ol className="mt-5 flex flex-1 flex-col gap-3">
            {FREE_STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3.5 rounded-2xl border border-[var(--hairline)] bg-white/70 p-3.5 text-left">
                <span className="coco-icon h-10 w-10 shrink-0">
                  <s.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <p className="coco-mono text-[10px] uppercase tracking-[0.12em] text-[var(--dim)]">Step {i + 1}</p>
                  <p className="coco-sub mt-0.5 text-[15.5px]">{s.title}</p>
                  <p className="coco-muted mt-1 text-[12.5px] leading-relaxed">{s.desc}</p>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href={BROKER_URL} target="_blank" rel="noopener noreferrer" className="coco-btn coco-btn-ghost w-full" data-testid="upgrade-plan-broker">
              <UserRoundPlus className="h-4 w-4" />
              Create account
            </a>
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="coco-btn w-full border border-[#dccdff] bg-[#ece4ff] text-[var(--iris)] hover:bg-[#e0d3ff]"
              data-testid="upgrade-plan-free-admin"
            >
              <Headset className="h-4 w-4" />
              Contact Admin
            </a>
          </div>
        </article>

        <article className="coco-shade ug-plan ug-plan-license" data-testid="upgrade-plan-license">
          <span className="coco-mono mx-auto rounded-full border border-white/18 bg-white/[0.08] px-3 py-1 text-[10px] uppercase text-white/75">
            instant access
          </span>
          <h3 className="coco-sub mt-4 text-center text-xl text-white">Direct plan</h3>
          <p className="mx-auto mt-2 max-w-[38ch] text-center text-sm text-white/60">No broker, no waiting. One month of unrestricted engine access.</p>
          <div className="mt-5 flex items-end justify-center gap-2">
            <span className="coco-display text-[2.6rem] leading-none text-white">$99</span>
            <span className="coco-mono mb-1 text-[11px] uppercase text-white/50">/ month</span>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-left">
            {LICENSE_PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-3 rounded-[10px] border border-white/[0.09] bg-gradient-to-r from-white/[0.075] to-white/[0.025] px-4 py-3 text-[13px] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-[#c4a6ff]/25 bg-[#c4a6ff]/12 text-[#c4a6ff]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">{perk}</span>
              </li>
            ))}
          </ul>
          <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="coco-btn coco-btn-primary mt-5 w-full" data-testid="upgrade-plan-purchase">
            <KeyRound className="h-4 w-4" />
            Purchase Plan
            <ArrowRight className="h-4 w-4" />
          </a>
        </article>
      </div>
    </div>
  )
}

function LimitView({ featureLabel }: { featureLabel: string | null }) {
  return (
    <div className="ug-body" data-testid="upgrade-gate-limit">
      <div className="ug-logo" aria-hidden="true">
        <span className="ug-logo-ring is-gold" />
        <span className="ug-logo-img">
          <Image src="/coco-ai.jpg" alt="Coco AI" fill sizes="72px" className="object-cover" />
        </span>
      </div>
      <h2 id="upgrade-title" className="coco-display coco-title-gradient ug-title" data-testid="upgrade-gate-title">
        Daily limit reached.
      </h2>
      <p className="coco-muted ug-lead">{`You've used every ${featureLabel ?? 'tool'} generation available today.`}</p>

      <div className="ug-reset coco-card" data-testid="upgrade-gate-reset">
        <span className="coco-icon h-10 w-10 shrink-0 is-gold">
          <Clock3 className="h-[18px] w-[18px]" />
        </span>
        <p className="coco-muted">
          Quota refreshes every morning after <b className="text-[var(--ink)]">6:00 AM</b> Bangladesh Standard Time <span className="whitespace-nowrap">(UTC+06:00)</span>.
        </p>
      </div>

      <div className="ug-actions">
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="coco-btn coco-btn-primary w-full" data-testid="upgrade-gate-limit-upgrade">
          <Crown className="h-4 w-4" />
          Upgrade Plan
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

export function useUpgradeGate() {
  const ctx = useContext(UpgradeGateContext)
  if (!ctx) throw new Error('useUpgradeGate must be used within an UpgradeGateProvider')
  return ctx
}
