'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import {
  Settings2,
  ListChecks,
  Banknote,
  BadgePercent,
  Crosshair,
  ShieldHalf,
  RefreshCcwDot,
  Check,
  X,
  PartyPopper,
  Coins,
  Layers3,
  Lightbulb,
  AlertTriangle,
  Gauge,
  Rows3,
  Undo2,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { PrimaryButton } from '@/components/signal-kit'
import { useSheetDrag } from '@/components/coco/use-sheet-drag'
import { useAuth } from '@/components/auth-provider'
import { useUpgradeGate } from '@/components/upgrade-gate'
import { simulate, normalizeResults, fmtMoney, MIN_TRADE, type TradeConfig, type TradeResult } from '@/lib/mtg'

const STORAGE_KEY = 'sweetex:management:session'

interface Session {
  config: TradeConfig
  results: TradeResult[]
}

type Tone = 'up' | 'down' | 'gold' | 'iris' | 'dim'
interface Level {
  label: string
  tone: Tone
}

function num(v: string) {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.config || !Array.isArray(parsed.results)) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session: Session | null) {
  if (typeof window === 'undefined') return
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function riskLevel(v: number): Level | null {
  if (!(v > 0)) return null
  if (v <= 20) return { label: 'Low risk', tone: 'up' }
  if (v <= 50) return { label: 'Medium risk', tone: 'gold' }
  if (v <= 70) return { label: 'High risk', tone: 'down' }
  return { label: 'Very high risk', tone: 'down' }
}
function targetLevel(v: number): Level | null {
  if (!(v > 0)) return null
  if (v <= 20) return { label: 'Conservative', tone: 'up' }
  if (v <= 50) return { label: 'Moderate', tone: 'gold' }
  if (v <= 70) return { label: 'Aggressive', tone: 'down' }
  return { label: 'Very aggressive', tone: 'down' }
}
function payoutLevel(v: number): Level | null {
  if (!(v > 0)) return null
  return v >= 78 ? { label: 'Good payout', tone: 'up' } : { label: 'Low payout', tone: 'down' }
}

export function ManagementView() {
  return (
    <AuthGuard>
      {() => (
        <CocoPageShell testid="management-page" width="max-w-4xl">
          <ManagementStudio />
        </CocoPageShell>
      )}
    </AuthGuard>
  )
}

function ManagementStudio() {
  const { hasAccess } = useAuth()
  const { open: openUpgrade } = useUpgradeGate()
  const [initialCapital, setInitialCapital] = useState('')
  const [averagePayout, setAveragePayout] = useState('')
  const [profitTarget, setProfitTarget] = useState('')
  const [riskPerTrade, setRiskPerTrade] = useState('')
  const [mtg, setMtg] = useState(false)
  const [tab, setTab] = useState<'management' | 'sheet'>('management')
  const [session, setSession] = useState<Session | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSession(loadSession())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveSession(session)
  }, [session, hydrated])

  const config = useMemo<TradeConfig>(
    () => ({
      initialCapital: num(initialCapital),
      averagePayout: num(averagePayout),
      profitTarget: num(profitTarget),
      riskPerTrade: num(riskPerTrade),
      mtg,
    }),
    [initialCapital, averagePayout, profitTarget, riskPerTrade, mtg],
  )

  const capitalTooLow = config.initialCapital > 0 && config.initialCapital < 10
  const preview = useMemo(() => simulate(config, []), [config])
  const riskTooLow = config.riskPerTrade > 0 && preview.rawRiskAmount < MIN_TRADE - 1e-9
  const profitTargetTooLow = config.profitTarget > 0 && preview.profitTargetAmount < MIN_TRADE - 1e-9

  const valid =
    config.initialCapital >= 10 &&
    config.averagePayout >= 78 &&
    config.profitTarget > 0 &&
    config.riskPerTrade > 0 &&
    !riskTooLow &&
    !profitTargetTooLow

  const sheet = useMemo(() => (session ? simulate(session.config, session.results) : null), [session])

  const generate = () => {
    if (!valid) return
    if (!hasAccess) {
      openUpgrade({ reason: 'locked' })
      return
    }
    setSession({ config, results: normalizeResults(config, []) })
    setTab('sheet')
  }

  const setResultAt = (i: number, r: TradeResult) => {
    if (!hasAccess) {
      openUpgrade({ reason: 'locked' })
      return
    }
    setSession((prev) => {
      if (!prev) return prev
      const next = prev.results.slice()
      next[i] = r
      return { ...prev, results: normalizeResults(prev.config, next) }
    })
  }

  const resetSheet = () => setSession((prev) => (prev ? { ...prev, results: normalizeResults(prev.config, []) } : prev))

  const progress = sheet && sheet.profitTargetAmount > 0 ? Math.max(0, Math.min(1, sheet.finalProfit / sheet.profitTargetAmount)) : 0

  return (
    <div className="inj mm flex flex-1 flex-col gap-4 sm:gap-5" data-testid="management-studio">
      <div className="tl-seg coco-rise" style={{ '--n': 2, '--d': '40ms' } as React.CSSProperties}>
        <span className="tl-seg-thumb" style={{ '--i': tab === 'management' ? 0 : 1 } as React.CSSProperties} aria-hidden="true" />
        <button type="button" className="tl-seg-item" data-active={tab === 'management'} onClick={() => setTab('management')} data-testid="mm-tab-management">
          <Settings2 className="h-4 w-4" />
          Management
        </button>
        <button type="button" className="tl-seg-item" data-active={tab === 'sheet'} onClick={() => setTab('sheet')} data-testid="mm-tab-sheet">
          <ListChecks className="h-4 w-4" />
          Sheet
          {sheet && <span className="tl-seg-badge">{sheet.rows.length}</span>}
        </button>
      </div>

      {tab === 'management' ? (
        <section className="mm-panel coco-rise" style={{ '--d': '100ms' } as React.CSSProperties} data-testid="mm-config">
          <span className="mm-panel-orb" aria-hidden="true" />
          <header className="mm-head">
            <span className="mm-head-icon">
              <Gauge className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mm-kicker">Session planner</p>
              <p className="coco-display text-[19px] leading-tight text-white sm:text-[21px]">Plan your session</p>
            </div>
          </header>

          <div className="mm-fields">
            <Field
              icon={Banknote}
              label="Initial capital"
              prefix="$"
              value={initialCapital}
              onChange={setInitialCapital}
              tone="iris"
              note={capitalTooLow ? 'Initial capital must be greater than 10 to generate a sheet.' : undefined}
              noteTone="down"
              testid="mm-capital"
            />
            <Field
              icon={BadgePercent}
              label="Average payout"
              suffix="%"
              value={averagePayout}
              onChange={(v) => setAveragePayout(Number(v) > 100 ? '100' : v)}
              integerOnly
              tone="up"
              badge={payoutLevel(config.averagePayout)}
              note={config.averagePayout > 0 && config.averagePayout < 78 ? 'Payout is below 78%. Markets paying above 78% give noticeably better returns.' : undefined}
              testid="mm-payout"
            />
            <Field
              icon={Crosshair}
              label="Profit target"
              suffix="%"
              value={profitTarget}
              onChange={setProfitTarget}
              tone="gold"
              badge={targetLevel(config.profitTarget)}
              hint={valid ? `${config.profitTarget}% of ${fmtMoney(config.initialCapital)} = ${fmtMoney(preview.profitTargetAmount)}` : undefined}
              note={profitTargetTooLow ? `${fmtMoney(preview.profitTargetAmount)} target — must be at least ${fmtMoney(MIN_TRADE)}.` : undefined}
              noteTone="down"
              testid="mm-target"
            />
            <Field
              icon={ShieldHalf}
              label="Risk per trade"
              suffix="%"
              value={riskPerTrade}
              onChange={setRiskPerTrade}
              integerOnly
              tone="down"
              badge={riskLevel(config.riskPerTrade)}
              hint={valid ? `${config.riskPerTrade}% of ${fmtMoney(config.initialCapital)} = ${fmtMoney(preview.rawRiskAmount)}` : undefined}
              note={riskTooLow ? `${fmtMoney(preview.rawRiskAmount)} per trade — each trade must be at least ${fmtMoney(MIN_TRADE)}.` : undefined}
              noteTone="down"
              testid="mm-risk"
            />
          </div>

          <MtgToggle value={mtg} onChange={setMtg} />

          {valid && (
            <div className="mm-preview coco-rise" data-testid="mm-preview">
              <Stat icon={Crosshair} label="Target" value={fmtMoney(preview.profitTargetAmount)} tone="gold" />
              <Stat icon={ShieldHalf} label="Per trade" value={fmtMoney(preview.baseRiskAmount)} tone="down" />
              <Stat icon={Layers3} label="Wins needed" value={String(normalizeResults(config, []).length)} tone="iris" />
            </div>
          )}

          <PrimaryButton onClick={generate} disabled={!valid} icon={Rows3} testid="mm-generate-button">
            Generate Sheet
          </PrimaryButton>
          <p className="mm-foot">{!valid ? 'Fill in all fields to generate your trade sheet.' : sheet ? 'A saved sheet exists — generating will replace it.' : 'Your sheet is saved on this device.'}</p>
        </section>
      ) : !hydrated ? null : !sheet ? (
        <section className="mm-panel coco-rise" style={{ '--d': '100ms' } as React.CSSProperties}>
          <div className="tl-state" data-testid="mm-empty">
            <span className="tl-state-icon">
              <ListChecks className="h-6 w-6" />
            </span>
            <div>
              <h3>No sheet generated yet</h3>
              <p className="mt-1">Enter your capital, payout, profit target and risk per trade to build a compounding trade sheet.</p>
            </div>
            <button type="button" onClick={() => setTab('management')} className="inj-btn-ghost" data-testid="mm-goto-config">
              <ChevronLeft className="h-3.5 w-3.5" />
              Go to Management
            </button>
          </div>
        </section>
      ) : (
        <div className="mm-sheet coco-rise" style={{ '--d': '100ms' } as React.CSSProperties} data-testid="mm-sheet">
          <aside className="mm-sheet-side">
            <ProgressPanel sheet={sheet} progress={progress} onReset={resetSheet} />
            <div className="mm-stats">
              <Stat icon={Crosshair} label="Target" value={fmtMoney(sheet.profitTargetAmount)} tone="gold" testid="mm-stat-target" />
              <Stat icon={ShieldHalf} label="Per trade" value={fmtMoney(sheet.baseRiskAmount)} tone="down" testid="mm-stat-risk" />
              <Stat icon={Coins} label="Per win" value={fmtMoney(sheet.perWinProfit)} tone="up" testid="mm-stat-win" />
              <Stat icon={Layers3} label="Trades" value={`${sheet.tradesDone}/${sheet.rows.length}`} tone="iris" testid="mm-stat-trades" />
            </div>
          </aside>
          <section className="mm-panel">
            <TradeSheet sheet={sheet} mtg={session!.config.mtg} onSet={setResultAt} />
          </section>
        </div>
      )}
    </div>
  )
}

/* ── pieces ── */

function Stat({ icon: Icon, label, value, tone, testid }: { icon: LucideIcon; label: string; value: string; tone: Tone; testid?: string }) {
  return (
    <div className="mm-stat" data-tone={tone}>
      <span className="mm-stat-icon">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <b className="coco-display truncate" data-testid={testid}>
          {value}
        </b>
        <em>{label}</em>
      </span>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  prefix,
  suffix,
  tone,
  hint,
  badge,
  note,
  noteTone = 'gold',
  integerOnly,
  testid,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  tone: Tone
  hint?: string
  badge?: Level | null
  note?: string | null
  noteTone?: 'gold' | 'down'
  integerOnly?: boolean
  testid: string
}) {
  return (
    <label className="mm-field" data-tone={tone}>
      <Icon className="mm-field-mark" />
      <span className="mm-field-head">
        <span className="mm-field-icon">
          <Icon className="h-4 w-4" />
        </span>
        <span className="mm-field-label">{label}</span>
        {badge && (
          <span className="tl-chip" data-tone={badge.tone} data-testid={`${testid}-badge`}>
            <i aria-hidden="true" />
            {badge.label}
          </span>
        )}
      </span>
      <span className="mm-field-input">
        {prefix && <span>{prefix}</span>}
        <input
          type="text"
          inputMode={integerOnly ? 'numeric' : 'decimal'}
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            if (integerOnly) return onChange(raw.replace(/[^\d]/g, ''))
            let cleaned = raw.replace(/[^\d.]/g, '')
            const dot = cleaned.indexOf('.')
            if (dot !== -1) cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '')
            onChange(cleaned)
          }}
          placeholder="0"
          data-testid={`${testid}-input`}
        />
        {suffix && <span>{suffix}</span>}
      </span>
      {hint && <span className="mm-field-hint">{hint}</span>}
      {note && (
        <span className="mm-field-note" data-tone={noteTone} data-testid={`${testid}-note`}>
          {noteTone === 'down' ? <AlertTriangle className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
          {note}
        </span>
      )}
    </label>
  )
}

function MtgToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mm-toggle" data-on={value} data-testid="mm-mtg-toggle">
      <span className="mm-toggle-icon">
        <RefreshCcwDot className="h-4 w-4" />
      </span>
      <span className="mm-toggle-text">
        <p className="mm-toggle-title">Martingale (MTG)</p>
        <p className="mm-toggle-sub">Double the stake after a loss</p>
      </span>
      <span className="mm-switch" data-on={value}>
        <i aria-hidden="true" />
        <button type="button" data-active={!value} onClick={() => onChange(false)} data-testid="mm-mtg-no">
          No
        </button>
        <button type="button" data-active={value} onClick={() => onChange(true)} data-testid="mm-mtg-yes">
          Yes
        </button>
      </span>
    </div>
  )
}

function ProgressPanel({ sheet, progress, onReset }: { sheet: ReturnType<typeof simulate>; progress: number; onReset: () => void }) {
  const pct = Math.round(progress * 100)
  const up = sheet.finalProfit >= 0
  return (
    <div className="mm-progress" data-tone={up ? 'up' : 'down'} data-testid="mm-progress">
      <span className="mm-panel-orb" aria-hidden="true" />
      <div className="mm-progress-top">
        <span className="mm-gauge" style={{ '--p': pct } as React.CSSProperties}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.9155" className="mm-gauge-track" />
            <circle cx="18" cy="18" r="15.9155" className="mm-gauge-fill" strokeDasharray={`${Math.max(pct, 0)} 100`} />
          </svg>
          <b data-testid="mm-progress-pct">{pct}%</b>
        </span>
        <div className="min-w-0 flex-1">
          <p className="mm-kicker">Net profit</p>
          <p className="mm-net coco-display" data-testid="mm-net-profit">
            {fmtMoney(sheet.finalProfit)}
          </p>
          <p className="mm-progress-target">
            of <b>{fmtMoney(sheet.profitTargetAmount)}</b> target
          </p>
        </div>
      </div>
      <div className="mm-bar">
        <i style={{ '--p': Math.max(progress, 0.02) } as React.CSSProperties} />
      </div>
      <div className="mm-counts">
        <span className="tl-chip" data-tone="up" data-testid="mm-wins">
          <Check className="h-3 w-3" strokeWidth={3} />
          {sheet.wins} W
        </span>
        <span className="tl-chip" data-tone="down" data-testid="mm-losses">
          <X className="h-3 w-3" strokeWidth={3} />
          {sheet.losses} L
        </span>
        <span className="tl-chip" data-tone="dim">
          <Layers3 className="h-3 w-3" />
          {sheet.pendingCount} planned
        </span>
        {sheet.tradesDone > 0 && (
          <button type="button" onClick={onReset} className="inj-btn-ghost" data-testid="mm-reset-button">
            <Undo2 className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function TradeSheet({ sheet, mtg, onSet }: { sheet: ReturnType<typeof simulate>; mtg: boolean; onSet: (i: number, r: TradeResult) => void }) {
  const [celebrate, setCelebrate] = useState(false)
  useEffect(() => setCelebrate(sheet.targetHit), [sheet.targetHit])

  return (
    <div className="mm-rows">
      <header className="mm-head">
        <span className="mm-head-icon">
          <ListChecks className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mm-kicker">Trade sheet</p>
          <p className="coco-display text-[17px] leading-tight text-white">Mark each trade as it closes</p>
        </div>
        <span className="tl-chip" data-tone="iris" data-testid="mm-sheet-count">
          {sheet.tradesDone}/{sheet.rows.length}
        </span>
      </header>
      {sheet.rows.map((row, i) => (
        <TradeRow key={row.index} row={row} mtg={mtg} delay={Math.min(i * 40, 400)} onSet={(r) => onSet(i, r)} />
      ))}
      {sheet.targetHit && celebrate && <Celebration sheet={sheet} onClose={() => setCelebrate(false)} />}
    </div>
  )
}

function TradeRow({ row, mtg, delay, onSet }: { row: ReturnType<typeof simulate>['rows'][number]; mtg: boolean; delay: number; onSet: (r: TradeResult) => void }) {
  const pending = row.pending
  const win = !pending && (row.result === 'win' || row.result === 'mtg')
  const loss = !pending && (row.result === 'loss' || row.result === 'loss-mtg')
  const isMtgResult = row.result === 'mtg'
  const isLossMtg = row.result === 'loss-mtg'
  const [menu, setMenu] = useState(false)
  const state = win ? 'win' : loss ? 'loss' : 'pending'

  return (
    <div className="mm-row" data-state={state} data-tone={win ? 'up' : loss ? 'down' : undefined} data-open={menu} style={{ '--d': `${delay}ms` } as React.CSSProperties} data-testid={`mm-row-${row.index}`}>
      <span className="mm-row-idx">{String(row.index).padStart(2, '0')}</span>
      <div className="mm-row-stake">
        <b data-testid={`mm-row-${row.index}-stake`}>{fmtMoney(row.amount)}</b>
        <em>
          Stake
          {row.isMtg && (
            <span className="tl-chip" data-tone={isLossMtg ? 'down' : 'iris'} style={{ height: 16, fontSize: 8.5 }}>
              <RefreshCcwDot className="h-2.5 w-2.5" />
              MTG
            </span>
          )}
        </em>
      </div>
      <div className="mm-row-pnl">
        <b data-testid={`mm-row-${row.index}-pnl`}>
          {pending ? '~' : row.pnl >= 0 ? '+' : ''}
          {fmtMoney(row.pnl)}
        </b>
        <em>
          {pending ? 'Planned' : 'Balance'} <b>{fmtMoney(row.cumulative)}</b>
        </em>
      </div>

      <div className="mm-acts">
        <button
          type="button"
          onClick={() => {
            setMenu(false)
            onSet('win')
          }}
          aria-label={`Mark trade ${row.index} as win`}
          className="mm-act"
          data-tone="up"
          data-on={win && !isMtgResult}
          data-testid={`mm-row-${row.index}-win`}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => (mtg ? setMenu((v) => !v) : onSet('loss'))}
          aria-label={`Mark trade ${row.index} as loss`}
          aria-expanded={mtg ? menu : undefined}
          className="mm-act"
          data-tone="down"
          data-on={loss}
          data-testid={`mm-row-${row.index}-loss`}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        {mtg && (
          <button
            type="button"
            onClick={() => {
              setMenu(false)
              onSet('mtg')
            }}
            aria-label={`Mark trade ${row.index} as MTG recovery profit`}
            className="mm-act"
            data-tone="iris"
            data-on={isMtgResult}
            data-testid={`mm-row-${row.index}-mtg`}
          >
            <RefreshCcwDot className="h-4 w-4" />
          </button>
        )}
        {mtg && menu && (
          <>
            <button type="button" className="mm-menu-veil" aria-label="Close loss options" onClick={() => setMenu(false)} />
            <div className="mm-menu" data-testid={`mm-row-${row.index}-loss-menu`}>
              <button type="button" className="mm-menu-item" data-on={row.result === 'loss'} onClick={() => { setMenu(false); onSet('loss') }}>
                <span>
                  <X className="h-3.5 w-3.5" style={{ color: '#ff8a95' }} />
                  Normal loss
                </span>
                <b>{fmtMoney(-row.amount)}</b>
              </button>
              <button type="button" className="mm-menu-item" data-on={isLossMtg} onClick={() => { setMenu(false); onSet('loss-mtg') }}>
                <span>
                  <RefreshCcwDot className="h-3.5 w-3.5" style={{ color: '#ff8a95' }} />
                  MTG loss
                </span>
                <b>{fmtMoney(-(row.amount * 3))}</b>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Celebration({ sheet, onClose }: { sheet: ReturnType<typeof simulate>; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { ref, handlers } = useSheetDrag(onClose)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <div className="tl-modal-root" role="dialog" aria-modal="true" aria-label="Profit target reached">
      <button type="button" aria-label="Close" onClick={onClose} className="tl-modal-backdrop" />
      <div ref={ref} className="inj mm tl-modal items-center text-center" style={{ maxWidth: 420 }} data-testid="mm-celebration" {...handlers}>
        <div className="tl-modal-head w-full" data-drag-handle>
          <span className="tl-modal-grab" aria-hidden="true" />
        </div>
        <div className="mm-trophy">
          <span>
            <PartyPopper className="h-8 w-8" />
          </span>
        </div>
        <div>
          <h2 className="coco-display text-balance text-[22px] text-white">Profit target reached</h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--inj-dim)' }}>
            {sheet.wins} wins{sheet.losses > 0 ? ` · ${sheet.losses} losses recovered` : ''} · <b style={{ color: '#a6ffd1' }}>{fmtMoney(sheet.finalProfit)}</b> of {fmtMoney(sheet.profitTargetAmount)}
          </p>
        </div>
        <PrimaryButton onClick={onClose} icon={Check} testid="mm-celebration-ok">
          Done
        </PrimaryButton>
      </div>
    </div>,
    document.body,
  )
}
