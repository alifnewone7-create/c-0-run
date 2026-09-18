'use client'

import { useEffect, useRef } from 'react'

const CLOSE_AT = 110

/** Drag-to-dismiss for bottom sheets (<640px). Whole sheet drags when content fits; otherwise only [data-drag-handle]. */
export function useSheetDrag(dismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ startY: 0, dy: 0, active: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => el.classList.toggle('is-fit', el.scrollHeight <= el.clientHeight + 2)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    const el = ref.current
    if (!el || window.innerWidth >= 640) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const onHandle = Boolean((e.target as HTMLElement).closest('[data-drag-handle]'))
    if (!onHandle && (!el.classList.contains('is-fit') || el.scrollTop > 0)) return
    drag.current = { startY: e.clientY, dy: 0, active: true }
    el.classList.remove('is-settled')
    el.classList.add('is-dragging')
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el || !drag.current.active) return
    const dy = Math.max(0, e.clientY - drag.current.startY)
    drag.current.dy = dy
    el.style.transform = `translate3d(0, ${dy}px, 0)`
  }
  function onPointerUp() {
    const el = ref.current
    if (!el || !drag.current.active) return
    drag.current.active = false
    el.classList.remove('is-dragging')
    el.classList.add('is-settled')
    if (drag.current.dy > CLOSE_AT) {
      el.style.transform = 'translate3d(0, 110%, 0)'
      el.style.opacity = '0'
      window.setTimeout(dismiss, 170)
    } else {
      el.style.transform = ''
    }
  }

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
