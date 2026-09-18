'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  BrainCircuit,
  Flame,
  Gauge,
  CalendarX,
  Clock,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
  Activity,
  History,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { PrimaryButton } from '@/components/signal-kit'
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

  return (
    <div className="inj flex flex-1 flex-col gap-4 sm:gap-5" data-testid="news-studio">
      <section className="inj-panel coco-rise" style={{ '--d': '60ms' } as React.CSSProperties}>
        <div className="tl-seg" style={{ '--n': 2 } as React.CSSProperties}>
          <span className="tl-seg-thumb" style={{ '--i': section === 'events' ? 0 : 1 } as React.CSSProperties} aria-hidden="true" />
          <button type="button" className="tl-seg-item" data-active={section === 'events'} onClick={() => setSection('events')} data-testid="news-tab-events">
            <CalendarDays className="h-4 w-4" />
            Today&apos;s Events
          </button>
          <button type="button" className="tl-seg-item" data-active={section === 'fundamental'} onClick={() => setSection('fundamental')} data-testid="news-tab-fundamental">
            <BrainCircuit className="h-4 w-4" />
            Fundamental
          </button>
        </div>

        {!authLoading && !hasAccess && <LockedState />}
        {hasAccess && (isLoading || (!data && !error)) && <LoadingState />}
        {hasAccess && error && !isLoading && <ErrorState onRetry={() => mutate()} message={String(error.message || error)} />}
      </section>

      {ready &&
        (section === 'events' ? (
          <EventsSection events={events} updatedAt={data?.updatedAt} onOpen={setActive} />
        ) : (
          <FundamentalSection events={fundamentals} onOpen={setActive} />
        ))}

      {active && <EventDetail event={active} onClose={() => setActive(null)} />}
    </div>
  )
}

/* ── shared bits ── */

function Flag({ currency }: { currency: string }) {
  return (
    <span className="nw-ev-flag" aria-hidden="true">
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
  const Icon = direction === 'UP' ? ArrowUp : direction === 'DOWN' ? ArrowDown : Minus
  return <Icon className={className} strokeWidth={3} />
}

function Dir({ direction, compact }: { direction: NewsEvent['direction']; compact?: boolean }) {
  return (
    <span className="nw-dir" data-tone={dirTone(direction)} data-compact={compact ? 'true' : undefined}>
      <DirIcon direction={direction} className="h-3.5 w-3.5" />
      {!compact && direction}
    </span>
  )
}

function Stat({ icon: Icon, label, value, tone, testid }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: Tone; testid?: string }) {
  return (
    <div className="tl-stat" data-tone={tone}>
      <span className="tl-stat-icon">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="tl-stat-value coco-display" data-testid={testid}>
          {value}
        </p>
        <p className="tl-stat-label">{label}</p>
      </div>
    </div>
  )
}

/* ── Today's events ── */

function EventsSection({ events, updatedAt, onOpen }: { events: NewsEvent[]; updatedAt?: string; onOpen: (e: NewsEvent) => void }) {
  if (events.length === 0) return <EmptyState label="No economic events scheduled for today." />
  const highCount = events.filter((e) => e.impact === 'high').length
  const dayRef = updatedAt ?? events[0].date
  const day = new Date(dayRef)

  return (
    <div className="nw-layout" data-testid="news-events">
      <aside className="nw-side inj-panel">
        <div className="nw-day">
          <span className="nw-day-num">{day.getDate()}</span>
          <div className="min-w-0">
            <p className="nw-day-title">{fmtDay(dayRef)}</p>
            <span className="nw-live">
              <i aria-hidden="true" />
              Auto-refresh · 1 min
            </span>
          </div>
        </div>
        <div className="tl-stats">
          <Stat icon={CalendarDays} label="Events" value={String(events.length)} tone="iris" testid="news-stat-events" />
          <Stat icon={Flame} label="High" value={String(highCount)} tone="down" testid="news-stat-high" />
          <Stat icon={Clock} label="Updated" value={updatedAt ? fmtTimeShort(updatedAt) : '--:--'} tone="up" />
        </div>
        <p className="nw-note hidden md:block">Tap any release to see forecast vs previous and the AI bias for that window.</p>
      </aside>

      <ol className="nw-timeline" data-testid="news-timeline">
        {events.map((ev, i) => (
          <li key={ev.id} data-tone={impactMeta[ev.impact].tone}>
            <span className="nw-ev-time" data-testid={`news-event-${i}-time`}>
              {fmtTimeShort(ev.date)}
            </span>
            <span className="nw-ev-node" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onOpen(ev)}
              className="nw-ev"
              style={{ '--d': `${Math.min(i * 40, 400)}ms` } as React.CSSProperties}
              data-testid={`news-event-${i}`}
            >
              <Flag currency={ev.currency} />
              <span className="nw-ev-body">
                <span className="nw-ev-meta">
                  <span className="nw-ccy">{ev.currency}</span>
                  <Chip tone={impactMeta[ev.impact].tone} label={impactMeta[ev.impact].label} />
                </span>
                <span className="nw-ev-title">{ev.title}</span>
              </span>
              <Dir direction={ev.direction} compact />
              <ChevronRight className="nw-ev-arrow h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Fundamental ── */

function FundamentalSection({ events, onOpen }: { events: NewsEvent[]; onOpen: (e: NewsEvent) => void }) {
  if (events.length === 0) return <EmptyState label="No high or medium impact events to analyze today." />
  const up = events.filter((e) => e.direction === 'UP').length
  const down = events.filter((e) => e.direction === 'DOWN').length

  return (
    <div className="flex flex-col gap-4" data-testid="news-fundamental">
      <div className="nw-ai inj-panel">
        <div className="nw-ai-head">
          <span className="inj-stat-icon">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="coco-sub text-[15px] text-white">AI fundamental read</p>
            <p className="inj-kicker">Forecast vs previous · mapped to currency bias</p>
          </div>
        </div>
        <div className="tl-stats">
          <Stat icon={ArrowUp} label="Bullish" value={String(up)} tone="up" testid="news-stat-bullish" />
          <Stat icon={ArrowDown} label="Bearish" value={String(down)} tone="down" testid="news-stat-bearish" />
          <Stat icon={Gauge} label="Signals" value={String(events.length)} tone="iris" />
        </div>
      </div>

      <div className="nw-fx-list">
        {events.map((ev, i) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onOpen(ev)}
            className="nw-fx"
            data-tone={dirTone(ev.direction)}
            style={{ '--d': `${Math.min(i * 50, 400)}ms`, '--p': ev.confidence / 100 } as React.CSSProperties}
            data-testid={`news-fx-${i}`}
          >
            <span className="nw-fx-top">
              <Flag currency={ev.currency} />
              <span className="nw-ev-body">
                <span className="nw-ev-meta">
                  <span className="nw-ccy">{ev.currency}</span>
                  <Chip tone={impactMeta[ev.impact].tone} label={impactMeta[ev.impact].label} />
                  <span className="nw-ccy" style={{ color: 'var(--inj-dim)' }}>
                    {fmtTimeShort(ev.date)}
                  </span>
                </span>
                <span className="nw-ev-title">{ev.title}</span>
              </span>
              <Dir direction={ev.direction} />
            </span>
            <span className="nw-fx-figs">
              <span className="nw-fig">
                <em>Forecast</em>
                <b>{ev.forecast || '—'}</b>
              </span>
              <span className="nw-fig">
                <em>Previous</em>
                <b>{ev.previous || '—'}</b>
              </span>
            </span>
            {ev.confidence > 0 && (
              <span className="nw-conf">
                <span className="nw-conf-bar">
                  <i />
                </span>
                <b>{ev.confidence}%</b>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Detail sheet ── */

function EventDetail({ event, onClose }: { event: NewsEvent; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
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
      <div className="inj inj-panel tl-modal" data-testid="news-detail">
        <span className="tl-modal-grab" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Flag currency={event.currency} />
            <div className="min-w-0">
              <div className="nw-ev-meta">
                <span className="nw-ccy">{event.currency}</span>
                <Chip tone={impactMeta[event.impact].tone} label={`${impactMeta[event.impact].label} impact`} />
              </div>
              <p className="inj-kicker">
                {fmtDay(event.date)} · {fmtTime(event.date)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="tl-close" data-testid="news-detail-close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="coco-sub text-balance text-[18px] leading-snug text-white sm:text-xl" data-testid="news-detail-title">
          {event.title}
        </h2>

        <div className="inj-stats">
          <div className="inj-stat">
            <span className="inj-stat-icon">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="inj-stat-label">Forecast</p>
              <p className="inj-stat-value coco-mono truncate">{event.forecast || '—'}</p>
            </div>
          </div>
          <div className="inj-stat">
            <span className="inj-stat-icon">
              <History className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="inj-stat-label">Previous</p>
              <p className="inj-stat-value coco-mono truncate">{event.previous || '—'}</p>
            </div>
          </div>
        </div>

        <div className="nw-bias" data-tone={tone} data-testid="news-detail-bias">
          <span className="nw-bias-medal">
            <DirIcon direction={event.direction} className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="inj-kicker inj-kicker-soft">Predicted bias · {event.currency}</p>
            <p className="nw-bias-word coco-display">{event.direction}</p>
            {event.confidence > 0 && <p className="inj-kicker">Confidence {event.confidence}%</p>}
          </div>
        </div>

        <div className="nw-reason">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" style={{ color: '#c7adff' }} />
            <span className="inj-kicker inj-kicker-soft">Fundamental logic</span>
          </span>
          {event.reasoning}
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
        <Lock className="h-6 w-6" />
      </span>
      <div>
        <h3>News Signals is locked</h3>
        <p className="mt-1">Your Free account can browse the app, but live news signals require a paid plan.</p>
      </div>
      <PrimaryButton onClick={() => open({ reason: 'locked' })} icon={KeyRound} testid="news-upgrade-button">
        Upgrade to unlock
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
