'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import {
  Search,
  ChevronLeft,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  Cpu,
  Check,
  X,
  Building2,
  ChevronRight,
  Syringe,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import { PairFlags } from '@/components/pair-flags'
import { GlyphOtc, GlyphReal } from '@/components/coco/coco-glyphs'
import { AnalyzeFlow } from '@/components/analyze-flow'
import { marketLabel, type Market, type MarketType } from '@/lib/markets'
import { BROKERS, readStoredBroker, storeBroker, getBroker, type Broker, type BrokerId } from '@/lib/brokers'
import { getStrategy, type StrategyId } from '@/lib/strategies'

export type Direction = 'UP' | 'DOWN'

export function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Live-signal entry rule: <30s into the minute => next minute, else skip one.
export function computeLiveEntry(now = new Date()): Date {
  const entry = new Date(now)
  entry.setSeconds(0, 0)
  entry.setMinutes(entry.getMinutes() + (now.getSeconds() < 30 ? 1 : 2))
  return entry
}

/* ── Broker ─────────────────────────────────────────────────────────── */

const DEFAULT_BROKER = getBroker('quotex') as Broker

export function useBroker(): [Broker, (id: BrokerId) => void] {
  const [broker, setBroker] = useState<Broker>(DEFAULT_BROKER)
  useEffect(() => {
    const sync = () => setBroker(readStoredBroker() ?? DEFAULT_BROKER)
    sync()
    window.addEventListener('coco:broker-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('coco:broker-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return [broker, storeBroker]
}

export function BrokerBar({ broker, onChange }: { broker: Broker; onChange: (id: BrokerId) => void }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sig-broker coco-rise"
        style={{ '--accent': broker.accent } as React.CSSProperties}
        data-testid="signal-broker-bar"
      >
        <span className="sig-broker-logo">
          <Image src={broker.logo} alt={broker.name} width={22} height={22} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="sig-broker-label">
            <Building2 className="h-3 w-3" />
            Broker
          </span>
          <span className="sig-broker-name" data-testid="signal-broker-name">
            {broker.name}
          </span>
        </span>
        <span className="sig-broker-change">
          Change
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="sig-picker-root" role="dialog" aria-modal="true" aria-label="Choose your broker">
            <button
              type="button"
              aria-label="Close broker picker"
              onClick={() => setOpen(false)}
              className="sig-picker-backdrop"
            />
            <div className="inj sig-picker" data-testid="broker-picker">
              <div className="flex items-center justify-between gap-3">
                <p className="inj-kicker inj-kicker-soft">Choose your broker</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close broker picker"
                  className="sig-picker-close"
                  data-testid="broker-picker-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="sig-picker-grid">
                {BROKERS.map((b, i) => {
                  const on = b.id === broker.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onChange(b.id)
                        setOpen(false)
                      }}
                      className="sig-picker-card"
                      data-on={on}
                      style={{ '--accent': b.accent, '--d': `${i * 60}ms` } as React.CSSProperties}
                      data-testid={`broker-pick-${b.id}`}
                    >
                      <span className="sig-picker-check" aria-hidden="true">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="sig-picker-logo">
                        <Image src={b.logo} alt={b.name} width={34} height={34} />
                      </span>
                      <span className="sig-picker-name">{b.name}</span>
                    </button>
                  )
                })}
              </div>
              <p className="sig-picker-foot">Your broker is remembered across every signal tool.</p>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export function BrokerLine({ broker, testid = 'signal-broker-line' }: { broker: Broker; testid?: string }) {
  return (
    <div className="sig-bcard" style={{ '--accent': broker.accent } as React.CSSProperties} data-testid={testid}>
      <span className="sig-bcard-glow" aria-hidden="true" />
      <span className="sig-bcard-logo">
        <Image src={broker.logo} alt={broker.name} width={26} height={26} />
      </span>
      <span className="sig-bcard-body">
        <span className="sig-bcard-label">
          <ShieldCheck className="h-3 w-3" />
          Signal broker
        </span>
        <span className="sig-bcard-name">{broker.name}</span>
      </span>
      <span className="sig-bcard-badge">
        <i aria-hidden="true" />
        Linked
      </span>
    </div>
  )
}

export function StrategyLine({ strategy, testid = 'signal-strategy-line' }: { strategy: StrategyId; testid?: string }) {
  const s = getStrategy(strategy)
  return (
    <div className="sig-scard" style={{ '--accent': s.accent } as React.CSSProperties} data-testid={testid}>
      <span className="sig-scard-glow" aria-hidden="true" />
      <span className="sig-scard-thumb" aria-hidden="true">
        <img src={s.imgSm} alt="" width={240} height={360} decoding="async" />
      </span>
      <span className="sig-scard-body">
        <span className="sig-scard-label">
          <Waypoints className="h-3 w-3" />
          Strategy
        </span>
        <span className="sig-scard-name">{s.name}</span>
        <span className="sig-scard-tag">{s.tagline}</span>
      </span>
      <span className="sig-scard-badge">Active</span>
    </div>
  )
}

/* ── Market picking ─────────────────────────────────────────────────── */

export function SegTabs({
  tab,
  onTab,
  lockedTo,
  testidPrefix,
}: {
  tab: MarketType
  onTab: (t: MarketType) => void
  lockedTo?: MarketType | null
  testidPrefix: string
}) {
  return (
    <div className="inj-seg" data-active={tab}>
      <span className="inj-seg-thumb" aria-hidden="true" />
      {(['otc', 'real'] as MarketType[]).map((t) => {
        const Icon = t === 'otc' ? GlyphOtc : GlyphReal
        return (
          <button
            key={t}
            type="button"
            className="inj-seg-item"
            data-active={tab === t}
            data-dim={Boolean(lockedTo && lockedTo !== t)}
            onClick={() => onTab(t)}
            data-testid={`${testidPrefix}-tab-${t}`}
          >
            <Icon className="inj-seg-glyph h-[19px] w-[19px]" />
            {t === 'otc' ? 'OTC Market' : 'Real Market'}
          </button>
        )
      })}
    </div>
  )
}

export function SearchBox({ value, onChange, testid }: { value: string; onChange: (v: string) => void; testid: string }) {
  return (
    <label className="inj-search">
      <Search className="h-4 w-4" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search pair (e.g. EUR/USD)" data-testid={testid} />
    </label>
  )
}

export function useMarketFilter(markets: Market[], query: string) {
  return useMemo(() => {
    const q = query.trim().toUpperCase()
    return q ? markets.filter((m) => `${m.base}/${m.quote}`.includes(q)) : markets
  }, [markets, query])
}

export type MarketVariant = 'list' | 'chips' | 'ticket'

export function MarketSections({
  markets,
  query,
  onPick,
  isSelected,
  isDisabled,
  testidPrefix,
  variant,
}: {
  markets: Market[]
  query: string
  onPick: (m: Market) => void
  isSelected?: (m: Market) => boolean
  isDisabled?: (m: Market) => boolean
  testidPrefix: string
  variant: MarketVariant
}) {
  return (
    <div className="mk" data-variant={variant}>
      <div className="mk-scroll scroll-rail" data-testid={`${testidPrefix}-market-grid`}>
        <div className="mk-grid">
          {markets.map((m, i) => (
            <MarketItem
              key={m.id}
              market={m}
              variant={variant}
              on={isSelected?.(m) ?? false}
              off={isDisabled?.(m) ?? false}
              selectable={Boolean(isSelected)}
              delay={Math.min(i, 28) * 22}
              onPick={onPick}
              testid={`${testidPrefix}-market-${m.type}-${m.base}${m.quote}`}
            />
          ))}
        </div>
        {markets.length === 0 && <p className="inj-empty">No markets match “{query}”.</p>}
      </div>
    </div>
  )
}

function MarketItem({
  market: m,
  variant,
  on,
  off,
  selectable,
  delay,
  onPick,
  testid,
}: {
  market: Market
  variant: MarketVariant
  on: boolean
  off: boolean
  selectable: boolean
  delay: number
  onPick: (m: Market) => void
  testid: string
}) {
  const pair = marketLabel(m)
  const marketName = m.type === 'otc' ? 'OTC Market' : 'Real Market'

  return (
    <button
      type="button"
      onClick={() => onPick(m)}
      disabled={off}
      aria-pressed={selectable ? on : undefined}
      className="mk-item"
      data-on={on}
      style={{ '--d': `${delay}ms` } as React.CSSProperties}
      data-testid={testid}
    >
      {variant === 'list' && (
        <>
          <PairFlags base={m.base} quote={m.quote} size={26} className="mk-flags" />
          <span className="mk-body">
            <span className="mk-pair">{pair}</span>
            <span className="mk-sub">{marketName}</span>
          </span>
          <span className="mk-live" aria-hidden="true">
            <i />
            1m
          </span>
          <ChevronRight className="mk-arrow h-4 w-4" aria-hidden="true" />
        </>
      )}

      {variant === 'chips' && (
        <>
          <span className="mk-lux-glow" aria-hidden="true" />
          <span className="mk-lux-mesh" aria-hidden="true" />
          <span className="mk-lux-top">
            <PairFlags base={m.base} quote={m.quote} size={22} className="mk-flags" />
          </span>
          <span className="mk-pair">{pair}</span>
          <span className="mk-lux-foot">
            <svg className="mk-lux-pulse" viewBox="0 0 64 16" fill="none" aria-hidden="true">
              <polyline points="0,9 12,9 17,3 22,14 27,6 31,9 44,9 49,4 54,12 58,9 64,9" />
            </svg>
            <span className="mk-lux-go" aria-hidden="true">
              <Syringe className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          </span>
        </>
      )}

      {variant === 'ticket' && (
        <>
          <span className="mk-ticket-top">
            <PairFlags base={m.base} quote={m.quote} size={22} className="mk-flags" />
            <span className="mk-check" aria-hidden="true">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </span>
          <span className="mk-pair">{pair}</span>
          <span className="mk-ticket-perf" aria-hidden="true" />
        </>
      )}
    </button>
  )
}

export function MarketHeader({
  market,
  suffix,
  onBack,
  backTestid = 'signal-change-market',
  nameTestid = 'signal-selected-market',
}: {
  market: Market
  suffix?: string
  onBack?: () => void
  backTestid?: string
  nameTestid?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <PairFlags base={market.base} quote={market.quote} size={30} />
        <div>
          <p className="coco-sub text-[17px] leading-tight text-white sm:text-lg" data-testid={nameTestid}>
            {marketLabel(market)}
          </p>
          <p className="inj-kicker">
            {market.type === 'otc' ? 'OTC Market' : 'Real Market'}
            {suffix ? ` · ${suffix}` : ''}
          </p>
        </div>
      </div>
      {onBack && (
        <button type="button" onClick={onBack} className="inj-btn-ghost" data-testid={backTestid}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Change
        </button>
      )}
    </div>
  )
}

/* ── Analyzing ─────────────────────────────────────────────────────── */

export function AnalyzingStage({ lines, durationMs = 10_000, testid }: { lines: string[]; durationMs?: number; testid: string }) {
  const [line, setLine] = useState(0)

  useEffect(() => {
    setLine(0)
    const step = durationMs / (lines.length + 1)
    const timers = lines.map((_, i) => setTimeout(() => setLine(i + 1), step * (i + 1)))
    return () => timers.forEach(clearTimeout)
  }, [lines, durationMs])

  return (
    <div className="inj-stage" data-testid={testid}>
      <AnalyzeFlow stage={line} />
      <div className="inj-stage-line" data-testid={`${testid}-line`}>
        <Cpu className="h-3.5 w-3.5" />
        <span className="animate-pulse">{lines[Math.min(line, lines.length - 1)]}…</span>
      </div>
      <div className="flex items-center gap-1.5">
        {lines.map((_, i) => (
          <span key={i} className="inj-dot" data-on={i < line} />
        ))}
      </div>
    </div>
  )
}

/* ── Result pieces ─────────────────────────────────────────────────── */

export function DirTag({ direction, testid, size = 'md' }: { direction: Direction; testid: string; size?: 'sm' | 'md' }) {
  const Arrow = direction === 'UP' ? ArrowUp : ArrowDown
  return (
    <span className="inj-dir-tag" data-tone={direction === 'UP' ? 'up' : 'down'} data-size={size} data-testid={testid}>
      <span className="inj-dir-tag-icon">
        <Arrow className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="inj-dir-tag-text">
        <i aria-hidden="true" />
        {direction}
      </span>
    </span>
  )
}

export function VerdictPlate({ direction, testid, kicker = 'Verdict locked' }: { direction: Direction; testid: string; kicker?: string }) {
  const up = direction === 'UP'
  const Arrow = up ? ArrowUp : ArrowDown
  const Chevron = up ? ChevronUp : ChevronDown
  return (
    <div className="inj-verdict" data-tone={up ? 'up' : 'down'} data-dir={up ? 'up' : 'down'} data-testid={testid}>
      <span className="inj-verdict-glow" aria-hidden="true" />
      <span className="inj-verdict-stripes" aria-hidden="true" />
      <div className="inj-verdict-medal" aria-hidden="true">
        <span className="inj-verdict-ring" />
        <span className="inj-verdict-ring inj-verdict-ring-2" />
        <span className="inj-verdict-core">
          <Arrow className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={3} />
        </span>
      </div>
      <div className="inj-verdict-body">
        <span className="inj-verdict-kicker">
          <i aria-hidden="true" />
          {kicker}
        </span>
        <p className="inj-verdict-word coco-display" data-testid={`${testid}-direction`}>
          {direction}
        </p>
      </div>
      <div className="inj-verdict-chevrons" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Chevron key={i} className="inj-verdict-chev" style={{ '--i': i } as React.CSSProperties} strokeWidth={2.5} />
        ))}
      </div>
      <span className="inj-verdict-rail" aria-hidden="true">
        <i />
      </span>
    </div>
  )
}

export function StatTile({
  icon: Icon,
  label,
  value,
  testid,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  testid: string
  tone?: 'iris' | 'mint' | 'amber'
}) {
  return (
    <div className={tone ? 'inj-stat inj-stat-grad' : 'inj-stat'} data-tone={tone}>
      <span className="inj-stat-icon">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="inj-stat-label">{label}</p>
        <p className="inj-stat-value coco-mono truncate" data-testid={testid}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function PrimaryButton({
  onClick,
  disabled,
  icon: Icon,
  children,
  testid,
  delay,
}: {
  onClick: () => void
  disabled?: boolean
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  testid: string
  delay?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={delay ? 'inj-btn coco-rise' : 'inj-btn'}
      style={delay ? ({ '--d': delay } as React.CSSProperties) : undefined}
      data-testid={testid}
    >
      <span className="inj-btn-sheen" aria-hidden="true" />
      <Icon className="h-[18px] w-[18px]" />
      {children}
    </button>
  )
}
