'use client'

import { useState } from 'react'
import { CocoBottomNav } from '@/components/coco/coco-bottom-nav'
import { DashSidebar, useSidebarCollapsed } from '@/components/dashboard/dash-sidebar'
import { DashMobileHeader, DashMascot } from '@/components/dashboard/dash-mobile'
import { DashDesktopHero } from '@/components/dashboard/dash-desktop-hero'
import { DashQuota } from '@/components/dashboard/dash-quota'
import { DashProfileSheet } from '@/components/dashboard/dash-profile-sheet'
import { DashToolsRing } from '@/components/dashboard/dash-tools-ring'
import { type UserProfile } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

export function DashboardContent({ profile }: { profile: UserProfile }) {
  const { collapsed, toggle } = useSidebarCollapsed()
  const [profileOpen, setProfileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  return (
    <div className={cn('coco dsh-root', collapsed && 'is-collapsed')} data-testid="dashboard-page">
      <DashSidebar collapsed={collapsed} onToggle={toggle} onProfile={() => setProfileOpen(true)} />

      <main className="dsh-main">
        <div className="dsh-dark-zone">
          <DashMobileHeader profile={profile} onProfile={() => setProfileOpen(true)} />
          <DashDesktopHero profile={profile} onOpenTools={() => setToolsOpen(true)} onProfile={() => setProfileOpen(true)} />
          <DashMascot onOpen={() => setToolsOpen(true)} />
        </div>
        <div className="coco-light coco-curve-top dsh-light-zone" data-testid="dashboard-light-zone">
          <DashQuota />
        </div>
      </main>

      <CocoBottomNav />
      <DashProfileSheet profile={profile} open={profileOpen} onClose={() => setProfileOpen(false)} />
      <DashToolsRing open={toolsOpen} onClose={() => setToolsOpen(false)} />
    </div>
  )
}
