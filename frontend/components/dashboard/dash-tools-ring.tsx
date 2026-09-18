'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { X, ArrowUpRight } from 'lucide-react'
import { TOOL_CARDS } from '@/components/dashboard/dash-data'
import { cn } from '@/lib/utils'

const N = TOOL_CARDS.length
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

export function DashToolsRing({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const ring = ringRef.current
    if (!ring) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const degPerSec = reduce ? 0 : 22
    rotY.current = 0
    vel.current = 0
    last.current = 0
    let raf = 0

    const apply = () => {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${rotY.current}deg)`
      const idx = ((Math.round(-rotY.current / ANGLE) % N) + N) % N
      if (idx !== frontIdx.current) {
        frontIdx.current = idx
        if (labelRef.current) labelRef.current.textContent = TOOL_CARDS[idx].name
        if (tagRef.current) tagRef.current.textContent = TOOL_CARDS[idx].tagline
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
  }, [open, radius])

  function close() {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 200)
  }

  function onPointerDown(e: React.PointerEvent) {
    const face = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]')
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = {
      active: true,
      x: e.clientX,
      startX: e.clientX,
      startY: e.clientY,
      idx: face ? Number(face.dataset.idx) : -1,
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
    if (!d.moved && d.idx >= 0) {
      const card = TOOL_CARDS[d.idx]
      onClose()
      router.push(card.href)
    }
  }

  if (!mounted || !open) return null

  return createPortal(
    <div className="coco dsh-ring-root" role="dialog" aria-modal="true" aria-label="Coco toolkit" data-testid="tools-ring">
      <button type="button" aria-label="Close toolkit" onClick={close} className={cn('dsh-backdrop is-ring', closing && 'is-closing')} data-testid="tools-ring-backdrop" />

      <div className={cn('dsh-ring-panel', closing && 'is-closing')}>
        <header className="dsh-ring-head">
          <div>
            <p className="coco-mono text-[9.5px] uppercase tracking-[0.18em] text-white/45">Coco toolkit</p>
            <h2 className="coco-display mt-1 text-[20px] text-white sm:text-[26px]">Pick a desk</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="dsh-sheet-close static" data-testid="tools-ring-close">
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
          data-testid="tools-ring-stage"
        >
          <div className="dsh-ring-tilt">
            <div ref={ringRef} className="dsh-ring" style={{ width: size.w, height: size.h }}>
              {TOOL_CARDS.map((card, i) => (
                <div
                  key={card.id}
                  className="dsh-ring-slot"
                  style={{ transform: `rotateY(${i * ANGLE}deg) translateZ(${radius}px)` }}
                >
                  <div className="dsh-ring-face" data-idx={i} data-testid={`tool-card-${card.id}`}>
                    <img src={card.img} alt={card.name} width={480} height={720} draggable={false} decoding="async" />
                    <span className="dsh-ring-face-go">
                      <ArrowUpRight className="h-3.5 w-3.5" />
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
          <span ref={labelRef} className="coco-sub block text-[17px] text-white" data-testid="tools-ring-label">
            {TOOL_CARDS[0].name}
          </span>
          <span ref={tagRef} className="mt-0.5 block text-[12px] text-white/55">
            {TOOL_CARDS[0].tagline}
          </span>
          <span className="coco-mono mt-3 inline-flex items-center gap-2 text-[9.5px] uppercase tracking-[0.16em] text-[#c4a6ff]/80">
            <span className="dsh-ring-dot" aria-hidden="true" />
            Swipe to rotate · tap a card to open
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
