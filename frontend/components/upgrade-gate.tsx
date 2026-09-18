'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Cpu,
  Gem,
  Headset,
  ArrowRight,
  ChevronLeft,
  Infinity as InfinityIcon,
  Zap,
  Sparkles,
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
  { icon: Zap, title: 'Instant activation', desc: 'Your plan switches on within minutes of verification.' },
  { icon: Headset, title: 'Priority desk', desc: 'Direct support line for members, every day.' },
]

const FREE_STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserRoundPlus, title: 'Create account', desc: 'Register through our exclusive partner link.' },
  { icon: CircleDollarSign, title: 'Fund balance', desc: 'A minimum of $50 in capital activates access.' },
  { icon: BadgeCheck, title: 'Verify UID', desc: 'Send your UID to the desk for instant verification.' },
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
    <div className={`ug-root${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="upgrade-title" data-testid="upgrade-gate">
      <button type="button" aria-label="Close" onClick={close} className="ug-backdrop" data-testid="upgrade-gate-backdrop" />
      <div ref={ref} className="ug-sheet inj" data-view={view} data-testid="upgrade-gate-sheet" {...handlers}>
        <span className="ug-hairline" aria-hidden="true" />
        <div className="ug-head" data-drag-handle>
          <span className="ug-grab" aria-hidden="true" />
          <div className="ug-head-row">
            {view === 'plans' ? (
              <button type="button" onClick={() => setView('locked')} className="ug-back" data-testid="upgrade-gate-back">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span className="ug-eyebrow">
                <Sparkles className="h-3 w-3" />
                {view === 'limit' ? 'Quota' : 'Coco engine'}
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
      <div className="ug-medal" aria-hidden="true">
        <span className="ug-medal-ring" />
        <span className="ug-medal-core">
          <Cpu className="h-7 w-7" />
        </span>
      </div>
      <h2 id="upgrade-title" className="ug-title coco-display" data-testid="upgrade-gate-title">
        Unlock your <span className="ug-title-accent">engine.</span>
      </h2>
      <p className="ug-lead">
        {message ??
          `Your Free account can explore every page. Generating results with ${featureLabel ?? 'the tools'} is reserved for members.`}
      </p>

      <ul className="ug-perks">
        {PERKS.map((p, i) => (
          <li key={p.title} className="ug-perk" style={{ '--d': `${80 + i * 60}ms` } as React.CSSProperties}>
            <span className="ug-perk-icon">
              <p.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <b>{p.title}</b>
              <em>{p.desc}</em>
            </span>
          </li>
        ))}
      </ul>

      <div className="ug-actions">
        <button type="button" onClick={onPlans} className="ug-btn ug-btn-primary" data-testid="upgrade-gate-view-plans">
          <span className="inj-btn-sheen" aria-hidden="true" />
          <Gem className="h-[18px] w-[18px]" />
          View Plans
          <ArrowRight className="h-4 w-4" />
        </button>
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-ghost" data-testid="upgrade-gate-contact-admin">
          <Headset className="h-[18px] w-[18px]" />
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
        <span className="ug-eyebrow">
          <Layers className="h-3 w-3" />
          Access paths
        </span>
        <h2 id="upgrade-title" className="ug-title coco-display" data-testid="upgrade-gate-plans-title">
          Two ways in. <span className="ug-title-accent">Same engine.</span>
        </h2>
        <p className="ug-lead">Earn free access through our partner broker, or take a direct plan and skip the setup completely.</p>
      </div>

      <div className="ug-plans">
        <article className="ug-plan ug-plan-free" data-testid="upgrade-plan-free">
          <header className="ug-plan-head">
            <div>
              <p className="ug-plan-kicker">Partner route</p>
              <h3 className="ug-plan-name coco-display">Free access</h3>
            </div>
            <span className="ug-price">
              <b>$0</b>
              <em>forever</em>
            </span>
          </header>
          <p className="ug-plan-sub">Three steps and the engine unlocks at no cost.</p>
          <ol className="ug-steps">
            {FREE_STEPS.map((s, i) => (
              <li key={s.title} className="ug-step">
                <span className="ug-step-num">
                  <s.icon className="h-4 w-4" />
                  <i>{i + 1}</i>
                </span>
                <span className="min-w-0">
                  <b>{s.title}</b>
                  <em>{s.desc}</em>
                </span>
              </li>
            ))}
          </ol>
          <div className="ug-plan-actions">
            <a href={BROKER_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-ghost" data-testid="upgrade-plan-broker">
              <UserRoundPlus className="h-4 w-4" />
              Create account
            </a>
            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-soft" data-testid="upgrade-plan-free-admin">
              <Headset className="h-4 w-4" />
              Contact Admin
            </a>
          </div>
        </article>

        <article className="ug-plan ug-plan-license" data-testid="upgrade-plan-license">
          <span className="ug-plan-glow" aria-hidden="true" />
          <header className="ug-plan-head">
            <div>
              <p className="ug-plan-kicker">Instant access</p>
              <h3 className="ug-plan-name coco-display">Direct plan</h3>
            </div>
            <span className="ug-price">
              <b>$99</b>
              <em>/ month</em>
            </span>
          </header>
          <p className="ug-plan-sub">No broker, no waiting. One month of unrestricted engine access.</p>
          <ul className="ug-perklist">
            {LICENSE_PERKS.map((perk) => (
              <li key={perk}>
                <span className="ug-tick">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <div className="ug-plan-actions">
            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-primary" data-testid="upgrade-plan-purchase">
              <span className="inj-btn-sheen" aria-hidden="true" />
              <KeyRound className="h-[18px] w-[18px]" />
              Purchase Plan
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </article>
      </div>
    </div>
  )
}

function LimitView({ featureLabel }: { featureLabel: string | null }) {
  return (
    <div className="ug-body" data-testid="upgrade-gate-limit">
      <div className="ug-medal is-gold" aria-hidden="true">
        <span className="ug-medal-ring" />
        <span className="ug-medal-core">
          <Hourglass className="h-7 w-7" />
        </span>
      </div>
      <h2 id="upgrade-title" className="ug-title coco-display" data-testid="upgrade-gate-title">
        Daily limit <span className="ug-title-accent">reached.</span>
      </h2>
      <p className="ug-lead">{`You've used every ${featureLabel ?? 'tool'} generation available today.`}</p>

      <div className="ug-reset" data-testid="upgrade-gate-reset">
        <span className="ug-reset-icon">
          <Clock3 className="h-4 w-4" />
        </span>
        <p>
          Quota refreshes every morning after <b>6:00 AM</b> Bangladesh Standard Time <span className="whitespace-nowrap">(UTC+06:00)</span>.
        </p>
      </div>

      <div className="ug-actions">
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-primary" data-testid="upgrade-gate-limit-upgrade">
          <span className="inj-btn-sheen" aria-hidden="true" />
          <Crown className="h-[18px] w-[18px]" />
          Upgrade Plan
          <ArrowRight className="h-4 w-4" />
        </a>
        <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" className="ug-btn ug-btn-ghost" data-testid="upgrade-gate-limit-admin">
          <Headset className="h-[18px] w-[18px]" />
          Contact Admin
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
