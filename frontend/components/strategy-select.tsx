'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Check, BrainCircuit } from 'lucide-react'
import { STRATEGIES, getStrategy, type StrategyId } from '@/lib/strategies'
import { cn } from '@/lib/utils'

const N = STRATEGIES.length
const ANGLE = 360 / N

function useRingSize() {
  const [size, setSize] = useState({ w: 150, h: 225, spacing: 2.2, persp: 1100 })
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      if (vw >= 1024) setSize({ w: 220, h: 330, spacing: 3, persp: 2200 })
      else if (vw >= 640) setSize({ w: 190, h: 285, spacing: 2.6, persp: 1600 })
      else setSize({ w: Math.min(168, vw * 0.43), h: Math.min(252, vw * 0.645), spacing: 2.2, persp: 1100 })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return size
}

/* Strategy field: looks like a select input, opens the strategy ring. */
export function StrategySelect({
  value,
  onChange,
  testidPrefix,
}: {
  value: StrategyId
  onChange: (id: StrategyId) => void
  testidPrefix: string
}) {
  const [open, setOpen] = useState(false)
  const active = getStrategy(value)

  return (
    <section className="stg" data-testid={`${testidPrefix}-strategy`}>
      <header className="stg-head">
        <span className="stg-head-icon" aria-hidden="true">
          <BrainCircuit className="h-4 w-4" />
        </span>
        <p className="inj-kicker inj-kicker-soft">Select strategy</p>
      </header>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="stg-field"
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{ '--accent': active.accent } as React.CSSProperties}
        data-testid={`${testidPrefix}-strategy-field`}
      >
        <span className="stg-field-thumb" aria-hidden="true">
          <img src={active.imgSm} alt="" width={240} height={360} decoding="async" />
        </span>
        <span className="stg-field-body">
          <span className="stg-field-name coco-sub" data-testid={`${testidPrefix}-strategy-value`}>
            {active.name}
          </span>
          <span className="stg-field-tag coco-mono">{active.tagline}</span>
        </span>
        <span className="stg-field-chev" aria-hidden="true">
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <p className="stg-note" data-testid={`${testidPrefix}-strategy-note`}>
        {active.note}
      </p>

      <StrategyRing
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onPick={(id) => {
          onChange(id)
          setOpen(false)
        }}
        testidPrefix={testidPrefix}
      />
    </section>
  )
}

function StrategyRing({
  open,
  value,
  onClose,
  onPick,
  testidPrefix,
}: {
  open: boolean
  value: StrategyId
  onClose: () => void
  onPick: (id: StrategyId) => void
  testidPrefix: string
}) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const size = useRingSize()

  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const tagRef = useRef<HTMLSpanElement>(null)
  const rotY = useRef(0)
  const vel = useRef(0)
  const last = useRef(0)
  const frontIdx = useRef(-1)
  const drag = useRef({ active: false, x: 0, startX: 0, startY: 0, idx: -1, moved: false })

  const factor = 1 + size.spacing * 0.15
  const radius = (size.w * factor) / (2 * Math.tan(Math.PI / N))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    /* Freeze the page underneath: the ring backdrop is fully opaque, so the
       signal page behind it never needs to paint while the ring spins. */
    document.documentElement.setAttribute('data-ring-open', 'stg')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.documentElement.removeAttribute('data-ring-open')
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const ring = ringRef.current
    if (!ring) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const degPerSec = reduce ? 0 : 20
    const startIdx = Math.max(0, STRATEGIES.findIndex((s) => s.id === value))
    rotY.current = -startIdx * ANGLE
    vel.current = 0
    last.current = 0
    let raf = 0

    const apply = () => {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${rotY.current}deg)`
      const idx = ((Math.round(-rotY.current / ANGLE) % N) + N) % N
      if (idx !== frontIdx.current) {
        frontIdx.current = idx
        if (labelRef.current) labelRef.current.textContent = STRATEGIES[idx].name
        if (tagRef.current) tagRef.current.textContent = STRATEGIES[idx].tagline
      }
    }

    const draw = (now: number) => {
      const dt = last.current ? Math.min((now - last.current) / 1000, 0.1) : 0
      last.current = now
      if (!drag.current.active) {
        if (Math.abs(vel.current) > 0.5) {
          rotY.current += vel.current * dt
          vel.current *= 0.94
        } else {
          rotY.current += degPerSec * dt
        }
      }
      apply()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [open, radius, value])

  function close() {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 200)
  }

  /* Which strategy does a tap at this point mean?
     - directly on a card face → that card
     - in the seam between two cards (the ring box in the middle of the
       stage) → the card currently shown at the front, so a tap in the
       centre never feels dead
     - anywhere else → nothing */
  function idxFromTarget(target: HTMLElement): number {
    const face = target.closest<HTMLElement>('[data-idx]')
    if (face) return Number(face.dataset.idx)
    if (target.closest('.dsh-ring-tilt')) return frontIdx.current
    return -1
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = {
      active: true,
      x: e.clientX,
      startX: e.clientX,
      startY: e.clientY,
      idx: idxFromTarget(e.target as HTMLElement),
      moved: false,
    }
    vel.current = 0
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.x
    d.x = e.clientX
    if (Math.abs(e.clientX - d.startX) > 8 || Math.abs(e.clientY - d.startY) > 8) d.moved = true
    rotY.current += dx * 0.45
    vel.current = dx * 0.45 * 60
  }
  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current
    if (!d.active) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    d.active = false
    if (!d.moved && d.idx >= 0) onPick(STRATEGIES[d.idx].id)
    /* a clean tap on the empty space around the cards dismisses the picker */
    else if (!d.moved && d.idx < 0) close()
  }
  function onClick(e: React.MouseEvent) {
    if (drag.current.moved) return
    const idx = idxFromTarget(e.target as HTMLElement)
    if (idx >= 0) onPick(STRATEGIES[idx].id)
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="coco dsh-ring-root stg-ring"
      role="dialog"
      aria-modal="true"
      aria-label="Select strategy"
      data-testid={`${testidPrefix}-strategy-ring`}
    >
      <button
        type="button"
        aria-label="Close strategy picker"
        onClick={close}
        className={cn('dsh-backdrop is-ring', closing && 'is-closing')}
        data-testid={`${testidPrefix}-strategy-backdrop`}
      />

      <div className={cn('dsh-ring-panel', closing && 'is-closing')}>
        <header className="dsh-ring-head">
          <div>
            <p className="coco-mono text-[9.5px] uppercase tracking-[0.18em] text-white/45">Coco engines</p>
            <h2 className="coco-display mt-1 text-[20px] text-white sm:text-[26px]">Pick a strategy</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="dsh-sheet-close static"
            data-testid={`${testidPrefix}-strategy-ring-close`}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="dsh-ring-stage"
          style={{ perspective: `${size.persp}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          data-testid={`${testidPrefix}-strategy-stage`}
        >
          <div className="dsh-ring-tilt">
            <div ref={ringRef} className="dsh-ring" style={{ width: size.w, height: size.h }}>
              {STRATEGIES.map((s, i) => (
                <div
                  key={s.id}
                  className="dsh-ring-slot"
                  style={{ transform: `rotateY(${i * ANGLE}deg) translateZ(${radius}px)` }}
                >
                  <div
                    className="dsh-ring-face stg-face"
                    data-idx={i}
                    data-on={value === s.id}
                    style={{ '--accent': s.accent } as React.CSSProperties}
                    data-testid={`${testidPrefix}-strategy-${s.id}`}
                  >
                    <img
                      src={size.w <= 180 ? s.imgSm : s.img}
                      alt=""
                      width={480}
                      height={720}
                      draggable={false}
                      decoding="async"
                    />
                    <span className="stg-face-text">
                      <span className="stg-face-name">{s.name}</span>
                      <span className="stg-face-tag">{s.tagline}</span>
                    </span>
                    <span className="stg-face-check" aria-hidden="true">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </div>
                  <div className="dsh-ring-back" aria-hidden="true">
                    <span className="coco-sub text-[12px] tracking-[0.2em] text-white/70">COCO AI</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="dsh-ring-foot">
          <span ref={labelRef} className="coco-sub block text-[17px] text-white" data-testid={`${testidPrefix}-strategy-ring-label`}>
            {getStrategy(value).name}
          </span>
          <span ref={tagRef} className="mt-0.5 block text-[12px] text-white/55">
            {getStrategy(value).tagline}
          </span>
          <span className="coco-mono mt-3 inline-flex items-center gap-2 text-[9.5px] uppercase tracking-[0.16em] text-[#c4a6ff]/80">
            <span className="dsh-ring-dot" aria-hidden="true" />
            Swipe to rotate · tap a card to select
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
