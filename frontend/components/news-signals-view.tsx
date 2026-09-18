'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { createPortal } from 'react-dom'
import {
  Newspaper,
  Atom,
  Flame,
  Radar,
  CalendarX,
  Clock3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Crosshair,
  History,
  RefreshCw,
  Loader2,
  AlertTriangle,
  LockKeyhole,
  KeyRound,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { PrimaryButton } from '@/components/signal-kit'
import { useSheetDrag } from '@/components/coco/use-sheet-drag'
import { flagUrl } from '@/lib/markets'
import { useAuth } from '@/components/auth-provider'
import { useUpgradeGate } from '@/components/upgrade-gate'

type NewsImpact = 'high' | 'medium' | 'low' | 'holiday'

type NewsEvent = {
  id: string
  title: string
  currency: string
  date: string
  impact: NewsImpact
  forecast: string
  previous: string
  direction: 'UP' | 'DOWN' | 'NEUTRAL'
  confidence: number
  reasoning: string
  forecastNum: number | null
  previousNum: number | null
}

type NewsResponse = { events: NewsEvent[]; updatedAt: string }
type Section = 'events' | 'fundamental'
type Tone = 'up' | 'down' | 'gold' | 'iris' | 'dim'

const fetcher = async ([url, token]: [string, string]): Promise<NewsResponse> => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || 'Failed to load events') as Error & { code?: string; status?: number }
    err.code = body.code
    err.status = res.status
    throw err
  }
  return res.json()
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtTimeShort(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}
function fmtClock(iso: string) {
  const [time, period] = fmtTime(iso).split(' ')
  return { time, period: period ?? '' }
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

const impactMeta: Record<NewsImpact, { label: string; tone: Tone }> = {
  high: { label: 'High', tone: 'down' },
  medium: { label: 'Medium', tone: 'gold' },
  low: { label: 'Low', tone: 'iris' },
  holiday: { label: 'Holiday', tone: 'dim' },
}

function dirTone(d: NewsEvent['direction']): Tone {
  return d === 'UP' ? 'up' : d === 'DOWN' ? 'down' : 'dim'
}
function dirWord(d: NewsEvent['direction']) {
  return d === 'UP' ? 'Bullish' : d === 'DOWN' ? 'Bearish' : 'Neutral'
}

export function NewsSignalsView() {
  return (
    <AuthGuard>
      {() => (
        <CocoPageShell testid="news-signals-page" width="max-w-4xl">
          <NewsStudio />
        </CocoPageShell>
      )}
    </AuthGuard>
  )
}

function NewsStudio() {
  const [section, setSection] = useState<Section>('events')
  const [active, setActive] = useState<NewsEvent | null>(null)
  const { getToken, hasAccess, loading: authLoading } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getToken().then((t) => {
      if (!cancelled) setToken(t)
    })
    return () => {
      cancelled = true
    }
  }, [getToken])

  const { data, error, isLoading, mutate } = useSWR<NewsResponse>(
    token && hasAccess ? ['/api/news', token] : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 },
  )

  const events = useMemo(() => {
    const all = data?.events ?? []
    const now = new Date()
    return all.filter((e) => {
      const d = new Date(e.date)
      return (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    })
  }, [data])

  const fundamentals = useMemo(() => events.filter((e) => e.impact === 'high' || e.impact === 'medium'), [events])
  const ready = hasAccess && !isLoading && !error && Boolean(data)
  const busy = hasAccess && (isLoading || (!data && !error))

  return (
    <div className="inj nw flex flex-1 flex-col gap-4 sm:gap-5" data-testid="news-studio">
      {ready && <DayHero events={events} updatedAt={data?.updatedAt} />}

      <div className="tl-seg coco-rise" style={{ '--n': 2, '--d': '80ms' } as React.CSSProperties}>
        <span className="tl-seg-thumb" style={{ '--i': section === 'events' ? 0 : 1 } as React.CSSProperties} aria-hidden="true" />
        <button type="button" className="tl-seg-item" data-active={section === 'events'} onClick={() => setSection('events')} data-testid="news-tab-events">
          <Newspaper className="h-4 w-4" />
          Today&apos;s Events
        </button>
        <button type="button" className="tl-seg-item" data-active={section === 'fundamental'} onClick={() => setSection('fundamental')} data-testid="news-tab-fundamental">
          <Atom className="h-4 w-4" />
          Fundamental
        </button>
      </div>

      {!authLoading && !hasAccess && <LockedState />}
      {busy && <LoadingState />}
      {hasAccess && error && !isLoading && <ErrorState onRetry={() => mutate()} message={String(error.message || error)} />}

      {ready &&
        (section === 'events' ? (
          <EventsSection events={events} onOpen={setActive} />
        ) : (
          <FundamentalSection events={fundamentals} onOpen={setActive} />
        ))}

      {active && <EventDetail event={active} onClose={() => setActive(null)} />}
    </div>
  )
}

/* ── shared bits ── */

function Flag({ currency, size }: { currency: string; size?: 'lg' }) {
  return (
    <span className="nw-flag" data-size={size} aria-hidden="true">
      <img src={flagUrl(currency)} alt="" loading="lazy" />
    </span>
  )
}

function Chip({ tone, label, testid }: { tone: Tone; label: string; testid?: string }) {
  return (
    <span className="tl-chip" data-tone={tone} data-testid={testid}>
      <i aria-hidden="true" />
      {label}
    </span>
  )
}

function DirIcon({ direction, className }: { direction: NewsEvent['direction']; className?: string }) {
  const Icon = direction === 'UP' ? TrendingUp : direction === 'DOWN' ? TrendingDown : Minus
  return <Icon className={className} strokeWidth={2.5} />
}

function DirBadge({ direction, label }: { direction: NewsEvent['direction']; label?: boolean }) {
  return (
    <span className="nw-dir" data-tone={dirTone(direction)} data-label={label ? 'true' : undefined}>
      <DirIcon direction={direction} className="h-4 w-4" />
      {label && dirWord(direction)}
    </span>
  )
}

function Stat({ icon: Icon, label, value, tone, testid }: { icon: LucideIcon; label: string; value: string; tone: Tone; testid?: string }) {
  return (
    <div className="nw-stat" data-tone={tone}>
      <span className="nw-stat-icon">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <b className="coco-display" data-testid={testid}>
          {value}
        </b>
        <em>{label}</em>
      </span>
    </div>
  )
}

/* ── Day hero ── */

function DayHero({ events, updatedAt }: { events: NewsEvent[]; updatedAt?: string }) {
  const dayRef = updatedAt ?? events[0]?.date ?? new Date().toISOString()
  const day = new Date(dayRef)
  const highCount = events.filter((e) => e.impact === 'high').length
  return (
    <section className="nw-hero coco-rise" style={{ '--d': '40ms' } as React.CSSProperties} data-testid="news-hero">
      <span className="nw-hero-orb" aria-hidden="true" />
      <div className="nw-hero-day">
        <span className="nw-day-tile">
          <b>{day.getDate()}</b>
          <em>{day.toLocaleDateString([], { month: 'short' })}</em>
        </span>
        <div className="min-w-0">
          <p className="nw-hero-kicker">Economic calendar</p>
          <p className="nw-hero-title coco-display">{fmtDay(dayRef)}</p>
          <span className="nw-live">
            <i aria-hidden="true" />
            Live · refreshes every minute
          </span>
        </div>
      </div>
      <div className="nw-hero-stats">
        <Stat icon={Newspaper} label="Events" value={String(events.length)} tone="iris" testid="news-stat-events" />
        <Stat icon={Flame} label="High impact" value={String(highCount)} tone="down" testid="news-stat-high" />
        <Stat icon={Clock3} label="Updated" value={updatedAt ? fmtTimeShort(updatedAt) : '--:--'} tone="up" />
      </div>
    </section>
  )
}

/* ── Today's events ── */

function EventsSection({ events, onOpen }: { events: NewsEvent[]; onOpen: (e: NewsEvent) => void }) {
  if (events.length === 0) return <EmptyState label="No economic events scheduled for today." />
  return (
    <ol className="nw-list" data-testid="news-events">
      {events.map((ev, i) => {
        const clock = fmtClock(ev.date)
        return (
          <li key={ev.id}>
            <button
              type="button"
              onClick={() => onOpen(ev)}
              className="nw-card"
              data-tone={impactMeta[ev.impact].tone}
              style={{ '--d': `${Math.min(i * 40, 400)}ms` } as React.CSSProperties}
              data-testid={`news-event-${i}`}
            >
              <span className="nw-card-time" data-testid={`news-event-${i}-time`}>
                <b>{clock.time}</b>
                <em>{clock.period}</em>
              </span>
              <span className="nw-card-main">
                <span className="nw-card-meta">
                  <Flag currency={ev.currency} />
                  <span className="nw-ccy">{ev.currency}</span>
                  <Chip tone={impactMeta[ev.impact].tone} label={impactMeta[ev.impact].label} />
                </span>
                <span className="nw-card-title">{ev.title}</span>
              </span>
              <DirBadge direction={ev.direction} />
              <ChevronRight className="nw-card-arrow h-4 w-4" />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* ── Fundamental ── */

function FundamentalSection({ events, onOpen }: { events: NewsEvent[]; onOpen: (e: NewsEvent) => void }) {
  if (events.length === 0) return <EmptyState label="No high or medium impact events to analyze today." />
  const up = events.filter((e) => e.direction === 'UP').length
  const down = events.filter((e) => e.direction === 'DOWN').length

  return (
    <div className="flex flex-col gap-4" data-testid="news-fundamental">
      <div className="nw-ai coco-rise" style={{ '--d': '60ms' } as React.CSSProperties}>
        <div className="nw-ai-head">
          <span className="nw-ai-icon">
            <Atom className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="nw-hero-kicker">AI fundamental read</p>
            <p className="coco-display text-[17px] text-white">Forecast vs previous, mapped to currency bias</p>
          </div>
        </div>
        <div className="nw-hero-stats">
          <Stat icon={TrendingUp} label="Bullish" value={String(up)} tone="up" testid="news-stat-bullish" />
          <Stat icon={TrendingDown} label="Bearish" value={String(down)} tone="down" testid="news-stat-bearish" />
          <Stat icon={Radar} label="Signals" value={String(events.length)} tone="iris" />
        </div>
      </div>

      <div className="nw-fx-grid">
        {events.map((ev, i) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onOpen(ev)}
            className="nw-fx"
            data-tone={dirTone(ev.direction)}
            style={{ '--d': `${Math.min(i * 50, 400)}ms` } as React.CSSProperties}
            data-testid={`news-fx-${i}`}
          >
            <span className="nw-fx-head">
              <Flag currency={ev.currency} />
              <span className="nw-card-meta">
                <span className="nw-ccy">{ev.currency}</span>
                <Chip tone={impactMeta[ev.impact].tone} label={impactMeta[ev.impact].label} />
              </span>
              <span className="nw-fx-time">{fmtTimeShort(ev.date)}</span>
            </span>
            <span className="nw-fx-title">{ev.title}</span>
            <span className="nw-figs">
              <span className="nw-fig">
                <Crosshair className="h-3.5 w-3.5" />
                <span>
                  <em>Forecast</em>
                  <b>{ev.forecast || '—'}</b>
                </span>
              </span>
              <span className="nw-fig">
                <History className="h-3.5 w-3.5" />
                <span>
                  <em>Previous</em>
                  <b>{ev.previous || '—'}</b>
                </span>
              </span>
            </span>
            <span className="nw-fx-foot">
              <DirBadge direction={ev.direction} label />
              {ev.confidence > 0 && <ConfidenceRing value={ev.confidence} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ConfidenceRing({ value, size = 40 }: { value: number; size?: number }) {
  const r = 15.9155
  return (
    <span className="nw-ring" style={{ width: size, height: size }} data-testid="news-confidence">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r={r} className="nw-ring-track" />
        <circle cx="18" cy="18" r={r} className="nw-ring-fill" strokeDasharray={`${value} 100`} />
      </svg>
      <b>{value}</b>
    </span>
  )
}

/* ── Detail sheet ── */

function EventDetail({ event, onClose }: { event: NewsEvent; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { ref, handlers } = useSheetDrag(onClose)
  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  if (!mounted) return null

  const tone = dirTone(event.direction)
  return createPortal(
    <div className="tl-modal-root" role="dialog" aria-modal="true" aria-label={event.title}>
      <button type="button" aria-label="Close details" onClick={onClose} className="tl-modal-backdrop" />
      <div ref={ref} className="inj nw tl-modal nw-detail" data-tone={tone} data-testid="news-detail" {...handlers}>
        <span className="nw-detail-orb" aria-hidden="true" />
        <div className="tl-modal-head" data-drag-handle>
          <span className="tl-modal-grab" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Flag currency={event.currency} size="lg" />
              <div className="min-w-0">
                <div className="nw-card-meta">
                  <span className="nw-ccy">{event.currency}</span>
                  <Chip tone={impactMeta[event.impact].tone} label={`${impactMeta[event.impact].label} impact`} />
                </div>
                <p className="nw-hero-kicker mt-1">
                  {fmtDay(event.date)} · {fmtTime(event.date)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="tl-close" data-testid="news-detail-close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h2 className="coco-display text-balance text-[20px] leading-snug text-white sm:text-[22px]" data-testid="news-detail-title">
          {event.title}
        </h2>

        <div className="nw-figs nw-figs-lg">
          <span className="nw-fig">
            <Crosshair className="h-4 w-4" />
            <span>
              <em>Forecast</em>
              <b>{event.forecast || '—'}</b>
            </span>
          </span>
          <span className="nw-fig">
            <History className="h-4 w-4" />
            <span>
              <em>Previous</em>
              <b>{event.previous || '—'}</b>
            </span>
          </span>
        </div>

        <div className="nw-bias" data-tone={tone} data-testid="news-detail-bias">
          <span className="nw-bias-medal">
            <DirIcon direction={event.direction} className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="nw-hero-kicker">Predicted bias · {event.currency}</p>
            <p className="nw-bias-word coco-display">{dirWord(event.direction)}</p>
          </div>
          {event.confidence > 0 && <ConfidenceRing value={event.confidence} size={54} />}
        </div>

        <div className="nw-reason">
          <span className="nw-reason-head">
            <Waypoints className="h-4 w-4" />
            Fundamental logic
          </span>
          <p>{event.reasoning}</p>
        </div>

        <p className="nw-fine">Educational estimate based on forecast vs previous data. Actual releases can move against expectations — always manage your risk.</p>
      </div>
    </div>,
    document.body,
  )
}

/* ── states ── */

function LoadingState() {
  return (
    <div className="tl-state" data-testid="news-loading">
      <Loader2 className="tl-spin h-6 w-6" style={{ color: '#c7adff' }} />
      <p>Loading today&apos;s economic calendar…</p>
    </div>
  )
}

function LockedState() {
  const { open } = useUpgradeGate()
  return (
    <div className="tl-state" data-testid="news-locked">
      <span className="tl-state-icon">
        <LockKeyhole className="h-6 w-6" />
      </span>
      <div>
        <h3>News Signals is locked</h3>
        <p className="mt-1">Your Free account can browse the app, but live news signals require an active plan.</p>
      </div>
      <PrimaryButton onClick={() => open({ reason: 'locked' })} icon={KeyRound} testid="news-upgrade-button">
        Unlock engine
      </PrimaryButton>
    </div>
  )
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="tl-state" data-testid="news-error">
      <span className="tl-state-icon" data-tone="down">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <h3>Couldn&apos;t load events</h3>
        <p className="mt-1">{message}</p>
      </div>
      <PrimaryButton onClick={onRetry} icon={RefreshCw} testid="news-retry-button">
        Try again
      </PrimaryButton>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="tl-state" data-testid="news-empty">
      <span className="tl-state-icon">
        <CalendarX className="h-6 w-6" />
      </span>
      <p>{label}</p>
    </div>
  )
}
