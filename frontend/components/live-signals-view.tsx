'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Timer, Scale, RefreshCw } from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { GlyphLive } from '@/components/coco/coco-glyphs'
import {
  AnalyzingStage,
  BrokerBar,
  BrokerLine,
  DirTag,
  MarketSections,
  MarketHeader,
  PrimaryButton,
  SearchBox,
  SegTabs,
  StatTile,
  StrategyLine,
  VerdictPlate,
  computeLiveEntry,
  formatTime,
  useBroker,
  useMarketFilter,
  type Direction,
} from '@/components/signal-kit'
import { otcMarkets, realMarkets, type Market, type MarketType } from '@/lib/markets'
import type { Broker } from '@/lib/brokers'
import { StrategySelect } from '@/components/strategy-select'
import { DEFAULT_STRATEGY, type StrategyId } from '@/lib/strategies'
import { useGatedAction } from '@/hooks/use-gated-action'

type Step = 'market' | 'confirm' | 'analyzing' | 'result'

type LiveSignal = {
  market: Market
  broker: Broker
  entry: Date
  direction: Direction
  seed: number
  strategy: StrategyId
}

const ANALYZING_MS = 10_000
const LINES = [
  'Linking neural core',
  'Streaming live candles',
  'Reading market pressure',
  'Running reverse-logic scan',
  'Locking entry window',
]

export function LiveSignalsView() {
  return (
    <AuthGuard>
      {() => (
        <CocoPageShell testid="live-signals-page" width="max-w-3xl">
          <LiveStudio />
        </CocoPageShell>
      )}
    </AuthGuard>
  )
}

function LiveStudio() {
  const { preflight, handleServerGate } = useGatedAction('live-signals')
  const [broker, setBroker] = useBroker()
  const [step, setStep] = useState<Step>('market')
  const [tab, setTab] = useState<MarketType>('otc')
  const [query, setQuery] = useState('')
  const [market, setMarket] = useState<Market | null>(null)
  const [strategy, setStrategy] = useState<StrategyId>(DEFAULT_STRATEGY)
  const [signal, setSignal] = useState<LiveSignal | null>(null)
  const [busy, setBusy] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMarketFilter(tab === 'otc' ? otcMarkets : realMarkets, query)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function scrollTop() {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function pickMarket(m: Market) {
    setMarket(m)
    setSignal(null)
    setStep('confirm')
    scrollTop()
  }

  function reset() {
    setMarket(null)
    setSignal(null)
    setStep('market')
    scrollTop()
  }

  async function generate() {
    if (!market || busy) return
    setBusy(true)
    try {
      const gate = await preflight()
      if (!gate.allowed) return

      const res = await fetch('/api/signals/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gate.token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        handleServerGate(res.status, body)
        return
      }
      const data = (await res.json()) as { direction: Direction }

      setStep('analyzing')
      scrollTop()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const entry = computeLiveEntry()
        setSignal({
          market,
          broker,
          entry,
          direction: data.direction,
          seed: (entry.getTime() / 60000) ^ (market.id.length * 7919),
          strategy,
        })
        setStep('result')
      }, ANALYZING_MS)
    } catch {
      /* network failure: stay on confirm */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={topRef} className="inj flex flex-1 scroll-mt-24 flex-col gap-4 sm:gap-5" data-testid="live-studio">
      {step !== 'result' && <BrokerBar broker={broker} onChange={setBroker} />}

      {step === 'market' && (
        <section className="inj-panel coco-rise" style={{ '--d': '80ms' } as React.CSSProperties} data-testid="live-market-step">
          <SegTabs tab={tab} onTab={setTab} testidPrefix="live" />
          <SearchBox value={query} onChange={setQuery} testid="live-search" />
          <MarketSections markets={filtered} query={query} onPick={pickMarket} testidPrefix="live" variant="list" />
        </section>
      )}

      {step === 'confirm' && market && (
        <section className="inj-panel coco-rise" style={{ '--d': '80ms' } as React.CSSProperties} data-testid="live-confirm-step">
          <MarketHeader market={market} onBack={reset} backTestid="live-change-market" nameTestid="live-selected-market" />
          <div className="inj-divider" />
          <StrategySelect value={strategy} onChange={setStrategy} testidPrefix="live" />
          <div className="inj-divider" />
          <div className="inj-stats">
            <StatTile icon={Timer} label="Duration" value="1 Minute" tone="iris" testid="live-rule-duration" />
            <StatTile icon={Scale} label="Money mgmt" value="1 Step MTG" tone="mint" testid="live-rule-mtg" />
          </div>
          <PrimaryButton onClick={generate} disabled={busy} icon={GlyphLive} testid="live-generate-button">
            {busy ? 'Preparing…' : 'Generate Live Signal'}
          </PrimaryButton>
        </section>
      )}

      {step === 'analyzing' && market && (
        <section className="inj-panel coco-rise" style={{ '--d': '40ms' } as React.CSSProperties}>
          <MarketHeader market={market} suffix="Live" nameTestid="live-selected-market" />
          <div className="inj-divider" />
          <AnalyzingStage lines={LINES} durationMs={ANALYZING_MS} testid="live-analyzing" />
        </section>
      )}

      {step === 'result' && signal && <LiveResult signal={signal} onReset={reset} />}
    </div>
  )
}

function LiveResult({ signal, onReset }: { signal: LiveSignal; onReset: () => void }) {
  const { market, entry, direction, broker } = signal

  return (
    <div className="flex flex-col gap-4" data-testid="live-result">
      <section className="inj-panel coco-rise" data-tone={direction === 'UP' ? 'up' : 'down'} style={{ '--d': '40ms' } as React.CSSProperties}>
        <div className="flex items-center justify-between gap-3">
          <MarketHeader market={market} suffix="Live" nameTestid="live-selected-market" />
          <DirTag direction={direction} testid="live-direction-pill" />
        </div>

        <BrokerLine broker={broker} testid="live-broker-card" />

        <VerdictPlate direction={direction} testid="live-verdict" kicker="Live verdict" />

        <div className="inj-stats inj-stats-3">
          <StatTile icon={Clock} label="Entry time" value={formatTime(entry)} tone="amber" testid="live-entry-time" />
          <StatTile icon={Timer} label="Duration" value="1 Min" tone="iris" testid="live-duration" />
          <StatTile icon={Scale} label="Money mgmt" value="1 Step MTG" tone="mint" testid="live-mtg" />
        </div>

        <StrategyLine strategy={signal.strategy} testid="live-strategy-used" />
      </section>

      <PrimaryButton onClick={onReset} icon={RefreshCw} testid="live-reset-button" delay="140ms">
        Generate New Signal
      </PrimaryButton>
    </div>
  )
}
