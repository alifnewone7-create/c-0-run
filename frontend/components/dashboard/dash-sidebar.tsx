'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, PanelLeftClose, PanelLeftOpen, BadgeCheck, ScanEye } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { SIDEBAR_SECTIONS } from '@/components/dashboard/dash-data'
import { DashBrokerModal } from '@/components/dashboard/dash-broker-modal'
import { TIER_LABEL } from '@/lib/tiers'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'coco_sidebar_collapsed'

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {}
  }, [])
  const toggle = () =>
    setCollapsed((v) => {
      const next = !v
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {}
      if (next) document.documentElement.setAttribute('data-sidebar', 'collapsed')
      else document.documentElement.removeAttribute('data-sidebar')
      return next
    })
  return { collapsed, toggle }
}

export function DashSidebar({
  collapsed,
  onToggle,
  onProfile,
}: {
  collapsed: boolean
  onToggle: () => void
  onProfile: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logout, tier } = useAuth()
  const [brokerOpen, setBrokerOpen] = useState(false)
  const analyzerActive = pathname === '/otc-chart-analyzer' || pathname === '/real-chart-analyzer'

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <aside className={cn('dsh-sidebar', collapsed && 'is-collapsed')} data-testid="dash-sidebar">
      <div className="dsh-side-head">
        <Link href="/dashboard" className="dsh-side-brand" data-testid="sidebar-brand">
          <span className="dsh-side-logo">
            <Image src="/coco-ai.jpg" alt="Coco AI" fill sizes="40px" className="object-cover" />
          </span>
          <span className="dsh-side-label coco-sub text-[17px] text-white">
            Coco <span className="coco-accent">AI</span>
          </span>
        </Link>
      </div>

      <nav className="dsh-side-nav">
        {SIDEBAR_SECTIONS.map((section, i) => (
          <div key={section.heading ?? i} className="dsh-side-stack">
          <div className="dsh-side-group">
            {section.heading ? (
              <p className="dsh-side-heading coco-mono">
                <span className="dsh-side-label">{section.heading}</span>
                <span className="dsh-side-heading-rule" aria-hidden="true" />
              </p>
            ) : null}
            {section.links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn('dsh-side-link', active && 'is-active')}
                  data-testid={`sidebar-link-${link.href.replace(/\//g, '')}`}
                >
                  <span className="dsh-side-link-icon">
                    <link.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="dsh-side-label">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {i === 0 && (
            <div className="dsh-side-group">
              <p className="dsh-side-heading coco-mono">
                <span className="dsh-side-label">Analyze</span>
                <span className="dsh-side-heading-rule" aria-hidden="true" />
              </p>
              <button
                type="button"
                onClick={() => setBrokerOpen(true)}
                title={collapsed ? 'Analyzer' : undefined}
                aria-haspopup="dialog"
                aria-current={analyzerActive ? 'page' : undefined}
                className={cn('dsh-side-link', analyzerActive && 'is-active')}
                data-testid="sidebar-analyzer-btn"
              >
                <span className="dsh-side-link-icon">
                  <ScanEye className="h-[18px] w-[18px]" />
                </span>
                <span className="dsh-side-label">Analyzer</span>
              </button>
            </div>
          )}
          </div>
        ))}
      </nav>

      <div className="dsh-side-foot">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
          title={collapsed ? 'Expand sidebar' : undefined}
          className="dsh-side-link dsh-side-toggle"
          data-testid="sidebar-toggle"
        >
          <span className="dsh-side-link-icon">
            {collapsed ? <PanelLeftOpen className="h-[17px] w-[17px]" /> : <PanelLeftClose className="h-[17px] w-[17px]" />}
          </span>
          <span className="dsh-side-label">Collapse sidebar</span>
        </button>
        <button
          type="button"
          onClick={onProfile}
          className="dsh-side-user"
          title={collapsed ? profile?.name : undefined}
          data-testid="sidebar-profile-btn"
        >
          <span className="dsh-side-avatar">
            <Image src="/coco-profile.png" alt="" fill sizes="38px" className="object-cover" />
          </span>
          <span className="dsh-side-label min-w-0 flex-1 text-left">
            <span className="flex items-center gap-1 truncate text-[13px] font-semibold text-white">
              <span className="truncate">{profile?.name || 'Trader'}</span>
              {tier !== 'free' && <BadgeCheck className="h-3.5 w-3.5 flex-none text-[#b48cff]" />}
            </span>
            <span className="coco-mono block text-[9.5px] uppercase tracking-[0.14em] text-[#c4a6ff]/80">
              {TIER_LABEL[tier]} plan
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="dsh-side-logout"
          title={collapsed ? 'Log out' : undefined}
          data-testid="sidebar-logout"
        >
          <span className="dsh-side-link-icon">
            <LogOut className="h-[17px] w-[17px]" />
          </span>
          <span className="dsh-side-label">Log out</span>
        </button>
      </div>

      <DashBrokerModal
        open={brokerOpen}
        onClose={() => setBrokerOpen(false)}
        onPick={() => {
          setBrokerOpen(false)
          router.push('/otc-chart-analyzer')
        }}
      />
    </aside>
  )
}
