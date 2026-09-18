'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { BROKERS, storeBroker, type BrokerId } from '@/lib/brokers'

export function DashBrokerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (id: BrokerId) => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your broker"
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      data-testid="broker-modal"
    >
      <button
        type="button"
        aria-label="Close broker picker"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#07031a]/80 backdrop-blur-sm"
      />
      <div className="dsh-broker-card relative z-10 w-full max-w-[520px]">
        <div className="flex items-center justify-between gap-3 px-1 pb-4">
          <p className="coco-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            Choose your broker
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close broker picker"
            className="coco-sheet-close"
            data-testid="broker-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="coco-arc" data-testid="broker-arc-desktop">
          {BROKERS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                storeBroker(b.id)
                onPick(b.id)
              }}
              className="coco-arc-card"
              style={
                {
                  '--lift': `${b.lift}px`,
                  '--tilt': `${b.tilt}deg`,
                  '--accent': b.accent,
                } as React.CSSProperties
              }
              data-testid={`broker-desktop-${b.id}`}
            >
              <span className="coco-arc-logo">
                <Image src={b.logo} alt={b.name} width={34} height={34} />
              </span>
              <span className="coco-arc-name">{b.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-2 px-3 text-center text-[11.5px] leading-relaxed text-white/45">
          Pick a broker to open the chart analyzer. You can switch between OTC and Real inside.
        </p>
      </div>
    </div>,
    document.body,
  )
}
