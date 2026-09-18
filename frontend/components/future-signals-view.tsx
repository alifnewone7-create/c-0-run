'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Timer, X, Minus, Plus, Coins, Sigma, Lock, RefreshCw, Layers, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Scale, ChevronDown, ChevronUp } from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { PairFlags } from '@/components/pair-flags'
import { GlyphFuture } from '@/components/coco/coco-glyphs'
import {
  AnalyzingStage,
  BrokerBar,
  BrokerLine,
  DirTag,
  MarketSections,
  PrimaryButton,
  SearchBox,
  SegTabs,
  StrategyLine,
  formatTime,
  useBroker,
  useMarketFilter,
  type Direction,
} from '@/components/signal-kit'
import { otcMarkets, realMarkets, marketLabel, type Market, type MarketType } from '@/lib/markets'
import type { Broker } from '@/lib/brokers'
import { StrategySelect } from '@/components/strategy-select'
import { DEFAULT_STRATEGY, getStrategy, type StrategyId } from '@/lib/strategies'
import { useGatedAction } from '@/hooks/use-gated-action'

type Phase = 'market' | 'setup' | 'analyzing' | 'result'

type Signal = {
  market: Market
  entry: Date
  direction: Direction
}

const ANALYZING_MS = 10_000
const LINES = [
  'Booting neural core',
  'Syncing candle streams',
  'Calibrating volatility model',
  'Mapping support & resistance',
  'Optimizing entry windows',
]
const PRESETS = [5, 10, 15, 20]
const MIN = 5
const MAX = 20

export function FutureSignalsView() {
  return (
    <AuthGuard>
      {() => (
        <CocoPageShell testid="future-signals-page" width="max-w-3xl">
          <FutureStudio />
        </CocoPageShell>
      )}
    </AuthGuard>
  )
}

function FutureStudio() {
  const { preflight, handleServerGate } = useGatedAction('future-signals')
  const [broker, setBroker] = useBroker()
  const [phase, setPhase] = useState<Phase>('market')
  const [tab, setTab] = useState<MarketType>('otc')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, Market>>({})
  const [count, setCount] = useState(5)
  const [strategy, setStrategy] = useState<StrategyId>(DEFAULT_STRATEGY)
  const [signals, setSignals] = useState<Signal[]>([])
  const [busy, setBusy] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)

  const selectedList = useMemo(() => Object.values(selected), [selected])
  const lockedType = selectedList[0]?.type ?? null
  const filtered = useMarketFilter(tab === 'otc' ? otcMarkets : realMarkets, query)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function scrollTop() {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function toggle(m: Market) {
    if (lockedType && lockedType !== m.type) return
    setSelected((prev) => {
      const next = { ...prev }
      if (next[m.id]) delete next[m.id]
      else next[m.id] = m
      return next
    })
  }

  function reset() {
    setSignals([])
    setPhase('market')
    scrollTop()
  }

  async function generate() {
    if (selectedList.length === 0 || busy) return
    setBusy(true)
    try {
      const gate = await preflight(count)
      if (!gate.allowed) return

      const res = await fetch('/api/signals/future', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gate.token}` },
        body: JSON.stringify({ count }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        handleServerGate(res.status, body)
        return
      }
      const data = (await res.json()) as { picks: { direction: Direction; offsetMin: number }[] }

      const base = Date.now()
      let cumulative = 0
      const queue: Signal[] = data.picks.map((pick, i) => {
        cumulative += pick.offsetMin
        return {
          market: selectedList[i % selectedList.length],
          entry: new Date(base + cumulative * 60_000),
          direction: pick.direction,
        }
      })

      setPhase('analyzing')
      scrollTop()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setSignals(queue)
        setPhase('result')
      }, ANALYZING_MS)
    } catch {
      /* network failure: stay on build */
    } finally {
      setBusy(false)
    }
  }

  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n))

  return (
    <div ref={topRef} className="inj flex flex-1 scroll-mt-24 flex-col gap-4 sm:gap-5" data-testid="future-studio">
      {phase !== 'result' && <BrokerBar broker={broker} onChange={setBroker} />}

      {phase === 'market' && (
        <>
          <section className="inj-panel coco-rise" style={{ '--d': '80ms' } as React.CSSProperties} data-testid="future-build-step">
            <SegTabs tab={tab} onTab={setTab} lockedTo={lockedType} testidPrefix="future" />
            <SearchBox value={query} onChange={setQuery} testid="future-search" />

            {lockedType && lockedType !== tab && (
              <p className="fs-lock" data-testid="future-lock-hint">
                {lockedType === 'otc' ? 'OTC Market' : 'Real Market'} is locked for this queue · clear the selection to switch.
              </p>
            )}

            <MarketSections
              markets={filtered}
              query={query}
              onPick={toggle}
              isSelected={(m) => Boolean(selected[m.id])}
              isDisabled={(m) => Boolean(lockedType && lockedType !== m.type)}
              testidPrefix="future"
              variant="ticket"
            />
          </section>

          <div className="fs-dock" data-testid="future-dock">
            <div className="fs-dock-sum">
              {selectedList.length > 0 ? (
                <>
                  <span className="fs-flag-stack" aria-hidden="true">
                    {selectedList.slice(0, 3).map((m) => (
                      <PairFlags key={m.id} base={m.base} quote={m.quote} size={18} />
                    ))}
                    {selectedList.length > 3 && <span className="fs-flag-more">+{selectedList.length - 3}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="fs-dock-title" data-testid="future-dock-summary">
                      {selectedList.length} pair{selectedList.length > 1 ? 's' : ''} selected
                    </span>
                    <span className="fs-dock-sub">Step 1 of 2 · {lockedType === 'otc' ? 'OTC Market' : 'Real Market'}</span>
                  </span>
                </>
              ) : (
                <span className="min-w-0">
                  <span className="fs-dock-title" data-testid="future-dock-summary">
                    No markets yet
                  </span>
                  <span className="fs-dock-sub">Step 1 of 2 · pick at least one pair</span>
                </span>
              )}
            </div>
            <PrimaryButton
              onClick={() => {
                setPhase('setup')
                scrollTop()
              }}
              disabled={selectedList.length === 0}
              icon={ArrowRight}
              testid="future-next-button"
            >
              Next Step
            </PrimaryButton>
          </div>
          <div className="h-16 md:hidden" aria-hidden="true" />
        </>
      )}

      {phase === 'setup' && (
        <>
          <section className="inj-panel fs-setup coco-rise" style={{ '--d': '80ms' } as React.CSSProperties} data-testid="future-setup">
            <header className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="coco-sub text-[17px] leading-tight text-white">Queue setup</p>
                <p className="inj-kicker">Step 2 of 2 · review and generate</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase('market')
                  scrollTop()
                }}
                className="inj-btn-ghost"
                data-testid="future-back-button"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Markets
              </button>
            </header>
            <div className="inj-divider" />

            <div className="fs-setup-grid">
              <div className="fs2-card" data-accent="iris">
                <header className="fs2-head">
                  <span className="fs2-icon">
                    <Coins className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="fs2-title">Selected markets</p>
                    <p className="fs2-sub">At least one pair stays in the queue</p>
                  </div>
                  <span className="fs2-badge" data-testid="future-selected-count">
                    <b className="coco-mono">{selectedList.length}</b>
                    <em>pair{selectedList.length > 1 ? 's' : ''}</em>
                  </span>
                </header>
                <SelectedRow list={selectedList} onRemove={toggle} />
              </div>

              <div className="fs2-card" data-accent="mint" data-testid="future-count">
                <header className="fs2-head">
                  <span className="fs2-icon">
                    <Sigma className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="fs2-title">How many signals?</p>
                    <p className="fs2-sub">
                      Tap the number to edit · {MIN}–{MAX}
                    </p>
                  </div>
                </header>

                <div className="fs2-dial">
                  <button
                    type="button"
                    onClick={() => setCount(clamp(count - 1))}
                    disabled={count <= MIN}
                    className="fs2-step"
                    aria-label="Decrease signal count"
                    data-testid="future-count-minus"
                  >
                    <Minus className="h-[18px] w-[18px]" />
                  </button>
                  <span className="fs2-value">
                    <CountField value={count} onCommit={(v) => setCount(clamp(v))} />
                    <em>signal{count > 1 ? 's' : ''} queued</em>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCount(clamp(count + 1))}
                    disabled={count >= MAX}
                    className="fs2-step"
                    aria-label="Increase signal count"
                    data-testid="future-count-plus"
                  >
                    <Plus className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <div className="fs2-rail" aria-hidden="true">
                  <i style={{ width: `${6 + ((count - MIN) / (MAX - MIN)) * 94}%` }} />
                </div>

                <div className="fs2-presets">
                  {PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => setCount(p)} className="fs2-preset" data-on={count === p} data-testid={`future-preset-${p}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="inj-divider" />
            <StrategySelect value={strategy} onChange={setStrategy} testidPrefix="future" />
          </section>

          <div className="fs-dock" data-testid="future-dock">
            <div className="fs-dock-sum">
              <span className="fs-flag-stack" aria-hidden="true">
                {selectedList.slice(0, 3).map((m) => (
                  <PairFlags key={m.id} base={m.base} quote={m.quote} size={18} />
                ))}
                {selectedList.length > 3 && <span className="fs-flag-more">+{selectedList.length - 3}</span>}
              </span>
              <span className="min-w-0">
                <span className="fs-dock-title" data-testid="future-dock-summary">
                  {selectedList.length} pair{selectedList.length > 1 ? 's' : ''} · {count} signal{count > 1 ? 's' : ''}
                </span>
                <span className="fs-dock-sub">{getStrategy(strategy).name} · {broker.name}</span>
              </span>
            </div>
            <PrimaryButton onClick={generate} disabled={selectedList.length === 0 || busy} icon={GlyphFuture} testid="future-generate-button">
              {busy ? 'Preparing…' : `Generate ${count} Signal${count > 1 ? 's' : ''}`}
            </PrimaryButton>
          </div>
          <div className="h-16 md:hidden" aria-hidden="true" />
        </>
      )}

      {phase === 'analyzing' && (
        <section className="inj-panel coco-rise" style={{ '--d': '40ms' } as React.CSSProperties}>
          <QueueHeader list={selectedList} count={count} />
          <div className="inj-divider" />
          <AnalyzingStage lines={LINES} durationMs={ANALYZING_MS} testid="future-analyzing" />
        </section>
      )}

      {phase === 'result' && <FutureResults signals={signals} broker={broker} markets={selectedList} onReset={reset} strategy={strategy} />}
    </div>
  )
}

function CountField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  function commit() {
    if (draft !== null) {
      const v = Number.parseInt(draft, 10)
      if (!Number.isNaN(v)) onCommit(v)
    }
    setDraft(null)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft ?? String(value)}
      onFocus={(e) => {
        setDraft(String(value))
        e.currentTarget.select()
      }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      aria-label="Signal count"
      data-testid="future-count-input"
    />
  )
}

function QueueHeader({ list, count }: { list: Market[]; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inj-stat-icon">
        <Layers className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="coco-sub text-[17px] leading-tight text-white sm:text-lg">
          {count} signal{count > 1 ? 's' : ''} · {list.length} market{list.length > 1 ? 's' : ''}
        </p>
        <p className="inj-kicker">{list[0]?.type === 'otc' ? 'OTC Market' : 'Real Market'} · Future queue</p>
      </div>
      <div className="fs-flag-stack" aria-hidden="true">
        {list.slice(0, 4).map((m) => (
          <PairFlags key={m.id} base={m.base} quote={m.quote} size={18} />
        ))}
        {list.length > 4 && <span className="fs-flag-more">+{list.length - 4}</span>}
      </div>
    </div>
  )
}

const VISIBLE = 4

function SelectedRow({ list, onRemove }: { list: Market[]; onRemove: (m: Market) => void }) {
  const [all, setAll] = useState(false)
  if (list.length === 0) {
    return (
      <p className="fs-selected-empty" data-testid="future-selected-empty">
        No pairs selected yet — your queue will appear here.
      </p>
    )
  }
  const locked = list.length === 1
  const overflow = list.length > VISIBLE
  const shown = all || !overflow ? list : list.slice(0, VISIBLE)
  return (
    <div className="fs-selected" data-testid="future-selected">
      <div className="fs-sel-grid">
        {shown.map((m, i) => (
          <span key={m.id} className="fs-sel" data-locked={locked} style={{ '--d': `${i * 40}ms` } as React.CSSProperties} data-testid={`future-chip-${m.base}${m.quote}`}>
            <PairFlags base={m.base} quote={m.quote} size={18} />
            <span className="fs-sel-body">
              <b className="truncate">{marketLabel(m)}</b>
              <em>{m.type === 'otc' ? 'OTC' : 'Real'}</em>
            </span>
            <button
              type="button"
              onClick={() => !locked && onRemove(m)}
              disabled={locked}
              title={locked ? 'Keep at least one market' : `Remove ${marketLabel(m)}`}
              aria-label={locked ? 'At least one market is required' : `Remove ${marketLabel(m)}`}
              data-testid={`future-chip-remove-${m.base}${m.quote}`}
            >
              {locked ? <Lock className="h-3 w-3" /> : <X className="h-3 w-3" />}
            </button>
          </span>
        ))}
      </div>
      {overflow && (
        <button type="button" onClick={() => setAll((v) => !v)} className="fs-sel-more" data-testid="future-selected-toggle">
          {all ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              See all {list.length} pairs
            </>
          )}
        </button>
      )}
      {locked && (
        <p className="fs2-hint" data-testid="future-selected-hint">
          <Lock className="h-3 w-3" />
          One market must stay — add more from the Markets step
        </p>
      )}
    </div>
  )
}

function FutureResults({ signals, broker, markets, onReset, strategy }: { signals: Signal[]; broker: Broker; markets: Market[]; onReset: () => void; strategy: StrategyId }) {
  const ups = signals.filter((s) => s.direction === 'UP').length
  return (
    <div className="flex flex-col gap-4" data-testid="future-result">
      <section className="inj-panel coco-rise" style={{ '--d': '40ms' } as React.CSSProperties}>
        <QueueHeader list={markets} count={signals.length} />
        <BrokerLine broker={broker} testid="future-broker-card" />
        <StrategyLine strategy={strategy} testid="future-strategy-used" />
        <div className="fsx-brokerrow">
          <p className="inj-kicker inj-kicker-soft">Signal queue</p>
          <span className="fs-mix" data-testid="future-mix">
            <i data-tone="up">
              <ArrowUp className="h-3 w-3" strokeWidth={3} />
              {ups}
            </i>
            <i data-tone="down">
              <ArrowDown className="h-3 w-3" strokeWidth={3} />
              {signals.length - ups}
            </i>
          </span>
        </div>
        <div className="inj-divider" />

        <ol className="fs-list">
          {signals.map((s, i) => (
            <li
              key={`${s.market.id}-${i}`}
              className="fsx"
              data-tone={s.direction === 'UP' ? 'up' : 'down'}
              style={{ '--d': `${80 + i * 60}ms` } as React.CSSProperties}
              data-testid={`future-signal-${i}`}
            >
              <div className="fsx-top">
                <span className="fsx-idx coco-mono">{String(i + 1).padStart(2, '0')}</span>
                <PairFlags base={s.market.base} quote={s.market.quote} size={24} />
                <div className="fsx-id">
                  <p className="fsx-pair">{marketLabel(s.market)}</p>
                  <p className="fsx-broker">{broker.name}</p>
                </div>
                <DirTag direction={s.direction} testid={`future-signal-${i}-direction`} size="sm" />
              </div>
              <div className="fsx-meta">
                <span className="fsx-cell" data-testid={`future-signal-${i}-entry`}>
                  <Clock className="h-3.5 w-3.5" />
                  <b>{formatTime(s.entry)}</b>
                  <em>entry</em>
                </span>
                <span className="fsx-cell">
                  <Timer className="h-3.5 w-3.5" />
                  <b>1 Min</b>
                  <em>expiry</em>
                </span>
                <span className="fsx-cell">
                  <Scale className="h-3.5 w-3.5" />
                  <b>1 Step</b>
                  <em>MTG</em>
                </span>
              </div>
              <span className="fsx-bar" aria-hidden="true">
                <i />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <PrimaryButton onClick={onReset} icon={RefreshCw} testid="future-reset-button" delay="140ms">
        Build New Queue
      </PrimaryButton>
    </div>
  )
}
