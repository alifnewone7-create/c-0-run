'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { DashSidebar, useSidebarCollapsed } from '@/components/dashboard/dash-sidebar'
import { DashProfileSheet } from '@/components/dashboard/dash-profile-sheet'
import { cn } from '@/lib/utils'

/* Desktop console frame: the dashboard sidebar wrapped around every app page. */
export function CocoAppFrame({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebarCollapsed()
  const [profileOpen, setProfileOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div className={cn('coco-frame', collapsed && 'is-collapsed')} data-testid="coco-app-frame">
      <DashSidebar collapsed={collapsed} onToggle={toggle} onProfile={() => setProfileOpen(true)} />
      <div className="coco-frame-main">{children}</div>
      {profile && (
        <DashProfileSheet profile={profile} open={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  )
}
