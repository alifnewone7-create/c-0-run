'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Menu,
  ScanLine,
  ScanSearch,
  LogOut,
  X,
  ChevronRight,
  Syringe,
  SatelliteDish,
  ScanEye,
  Orbit,
  Megaphone,
  Wallet,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { BROKERS, storeBroker, type BrokerId } from '@/lib/brokers'
import { cn } from '@/lib/utils'

const MORE_LINKS = [
  { label: 'Future Signals', href: '/future-signals', icon: Orbit },
  { label: 'News Signals', href: '/news-signals', icon: Megaphone },
  { label: 'Management', href: '/management', icon: Wallet },
]

const ANALYZERS = [
  { label: 'OTC Chart Analyzer', href: '/otc-chart-analyzer', icon: ScanLine },
  { label: 'Real Chart Analyzer', href: '/real-chart-analyzer', icon: ScanSearch },
]

export function CocoBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logout } = useAuth()
  const [sheet, setSheet] = useState<'more' | 'analyzer' | null>(null)
  const [closing, setClosing] = useState(false)
  const [drag, setDrag] = useState(0)
  const dragging = useRef(false)
  const startY = useRef(0)

  useEffect(() => {
    setSheet(null)
    setClosing(false)
    setDrag(0)
  }, [pathname])

  useEffect(() => {
    if (!sheet) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheet])

  // Animated close: play the slide-down, then unmount.
  function closeSheet() {
    setClosing(true)
    window.setTimeout(() => {
      setSheet(null)
      setClosing(false)
      setDrag(0)
    }, 170)
  }

  function toggleSheet(next: 'more' | 'analyzer') {
    if (sheet === next && !closing) {
      closeSheet()
      return
    }
    setClosing(false)
    setDrag(0)
    setSheet(next)
  }

  /* Swipe / drag the sheet downwards to dismiss it. */
  function onPointerDown(e: React.PointerEvent) {
    // Never hijack taps on real controls (close button etc.)
    if ((e.target as HTMLElement).closest('button, a')) return
    dragging.current = true
    startY.current = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const dy = e.clientY - startY.current
    setDrag(dy > 0 ? Math.min(dy, 320) : Math.max(dy / 4, -16))
  }

  function onPointerUp() {
    if (!dragging.current) return
    dragging.current = false
    if (drag > 90) {
      closeSheet()
    } else {
      setDrag(0)
    }
  }

  const analyzerActive = ANALYZERS.some((a) => a.href === pathname)
  const moreActive = MORE_LINKS.some((l) => l.href === pathname)

  function pickBroker(id: BrokerId) {
    storeBroker(id)
    setSheet(null)
    setClosing(false)
    setDrag(0)
    router.push('/otc-chart-analyzer')
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const grabHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }

  return (
    <>
      {sheet && (
        <div className="coco fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeSheet}
            className={cn('coco-sheet-backdrop absolute inset-0 cursor-default', closing && 'opacity-0')}
          />
          <div
            className={cn(
              'coco-sheet absolute inset-x-0 bottom-0 pb-[max(14px,env(safe-area-inset-bottom))]',
              closing && 'is-closing',
              drag !== 0 && 'is-dragging',
            )}
            style={drag !== 0 ? { transform: `translate3d(0,${drag}px,0)` } : undefined}
          >
            {/* Grab bar — drag the sheet down to close it */}
            <div
              className="flex touch-none select-none items-center justify-center pb-1 pt-3"
              {...grabHandlers}
              data-testid="bottom-sheet-grab"
            >
              <span className="coco-sheet-grab" aria-hidden="true" />
            </div>

            {sheet === 'more' ? (
              <>
                <div
                  className="flex touch-none items-center justify-between gap-3 px-5 pb-3 pt-1"
                  {...grabHandlers}
                >
                  <p className="coco-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                    Menu
                  </p>
                  <button
                    type="button"
                    onClick={closeSheet}
                    aria-label="Close menu"
                    className="coco-sheet-close"
                    data-testid="bottom-nav-more-close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-3">
                  <div className="coco-sheet-profile" data-testid="bottom-sheet-user">
                    <span className="coco-sheet-avatar">
                      <Image src="/coco-ai.jpg" alt="Coco AI" fill sizes="48px" className="object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="coco-sub truncate text-[16px] leading-tight text-white" data-testid="bottom-sheet-name">
                        {profile?.name || 'Trader'}
                      </p>
                      <p className="coco-mono mt-1 truncate text-[10.5px] text-white/50" data-testid="bottom-sheet-email">
                        {profile?.email || 'Signed in'}
                      </p>
                    </div>
                    <span className="coco-sheet-plan" data-testid="bottom-sheet-plan">
                      <Sparkles className="h-3 w-3" />
                      {profile?.plan || 'free'}
                    </span>
                  </div>
                </div>

                <nav className="coco-sheet-grid px-3 pt-3">
                  {MORE_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn('coco-sheet-tile', pathname === l.href && 'is-active')}
                      data-testid={`bottom-nav-more-${l.href.replace(/\//g, '') || 'home'}`}
                    >
                      <span className="coco-sheet-tile-icon">
                        <l.icon className="h-[19px] w-[19px]" />
                      </span>
                      <span className="coco-sheet-tile-label">{l.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="px-3">
                  <span className="coco-sheet-divider" aria-hidden="true" data-testid="bottom-sheet-divider" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="coco-sheet-logout"
                    data-testid="bottom-nav-logout"
                  >
                    <span className="coco-sheet-logout-icon">
                      <LogOut className="h-[16px] w-[16px]" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[13.5px] font-semibold leading-tight tracking-[-0.01em]">
                        Log out
                      </span>
                      <span className="coco-mono mt-[3px] block text-[9px] uppercase tracking-[0.14em] text-[#ffb3ba]/55">
                        Sign out of this device
                      </span>
                    </span>
                    <ChevronRight className="coco-sheet-logout-chev h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="px-3 pb-3 pt-1">
                <div
                  className="flex touch-none items-center justify-between gap-3 px-3 pb-1"
                  {...grabHandlers}
                >
                  <p className="coco-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    Choose your broker
                  </p>
                  <button
                    type="button"
                    onClick={closeSheet}
                    aria-label="Close menu"
                    className="coco-sheet-close"
                    data-testid="bottom-nav-analyzer-close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="coco-arc" data-testid="broker-arc">
                  {BROKERS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pickBroker(b.id)}
                      className="coco-arc-card"
                      style={
                        {
                          '--lift': `${b.lift}px`,
                          '--tilt': `${b.tilt}deg`,
                          '--accent': b.accent,
                        } as React.CSSProperties
                      }
                      data-testid={`broker-${b.id}`}
                    >
                      <span className="coco-arc-logo">
                        <Image src={b.logo} alt={b.name} width={34} height={34} />
                      </span>
                      <span className="coco-arc-name">{b.name}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-1 px-3 text-center text-[11.5px] leading-relaxed text-white/45">
                  Pick a broker to open the chart analyzer. You can switch between OTC and Real
                  inside.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="coco coco-bottom-nav md:hidden" data-testid="bottom-nav">
        <Link
          href="/dashboard"
          className={cn('coco-bnav-item', pathname === '/dashboard' && 'is-active')}
          data-testid="bottom-nav-dashboard"
        >
          <LayoutDashboard className="h-[19px] w-[19px]" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/live-signals"
          className={cn('coco-bnav-item', pathname === '/live-signals' && 'is-active')}
          data-testid="bottom-nav-live"
        >
          <SatelliteDish className="h-[19px] w-[19px]" />
          <span>Live</span>
        </Link>

        <button
          type="button"
          onClick={() => toggleSheet('analyzer')}
          aria-label="Chart analyzer"
          className={cn('coco-bnav-center', analyzerActive && 'is-active')}
          data-testid="bottom-nav-analyzer"
        >
          <span className="coco-bnav-center-tile">
            <ScanEye className="h-6 w-6" />
          </span>
          <span className="coco-bnav-center-label">Analyzer</span>
        </button>

        <Link
          href="/injector"
          className={cn('coco-bnav-item', pathname === '/injector' && 'is-active')}
          data-testid="bottom-nav-injector"
        >
          <Syringe className="h-[19px] w-[19px]" />
          <span>Injector</span>
        </Link>

        <button
          type="button"
          onClick={() => toggleSheet('more')}
          className={cn('coco-bnav-item', (moreActive || sheet === 'more') && 'is-active')}
          data-testid="bottom-nav-more"
        >
          <Menu className="h-[19px] w-[19px]" />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
