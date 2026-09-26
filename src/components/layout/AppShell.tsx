import { useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { DesktopRail } from './DesktopRail'
import { MobileTopBar } from './MobileTopBar'
import { ExpandedSidebar } from './ExpandedSidebar'
import type { Profile } from '../../types/inventory'
import type { User } from '@supabase/supabase-js'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/operations/receipts': 'Receipts',
  '/operations/deliveries': 'Deliveries',
  '/operations/transfers': 'Internal Transfers',
  '/operations/adjustments': 'Adjustments',
  '/operations/ledger': 'Stock Ledger',
  '/warehouses': 'Warehouses',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
  '/profile': 'My Profile',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + '/')) return title
  }
  return 'StockSense'
}

function useRecents(userId?: string) {
  const [recents, setRecents] = useState<{ label: string; type: string; path: string }[]>([])
  const key = userId ? `ss_recents_${userId}` : null

  useEffect(() => {
    if (!key) return
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? '[]')
      setRecents(stored)
    } catch { /* ignore */ }
  }, [key])

  const addRecent = useCallback((item: { label: string; type: string; path: string }) => {
    if (!key) return
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.path !== item.path)
      const next = [item, ...filtered].slice(0, 8)
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])

  return { recents, addRecent }
}

import { useAuth } from '../../hooks/useAuth'

interface AppShellProps {
  user?: User | null
  profile?: Profile | null
  children: React.ReactNode
  notificationCount?: number
}

export function AppShell({ user: propUser, profile: propProfile, children, notificationCount = 0 }: AppShellProps) {
  const auth = useAuth()
  const user = propUser !== undefined ? propUser : auth.user
  const profile = propProfile !== undefined ? propProfile : auth.profile
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { recents } = useRecents(user?.id)

  const currentPageTitle = getPageTitle(location.pathname)
  const isOps = location.pathname.startsWith('/operations')

  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#070A0E] text-[#0B0D10] dark:text-[#F5F7FA] transition-colors duration-150">
      {/* Desktop 68px Icon-Only Compact Rail */}
      <DesktopRail
        user={user}
        profile={profile}
        recents={recents}
        onExpandedOpen={() => setSidebarOpen(true)}
        notificationCount={notificationCount}
      />

      {/* Expanded Sidebar Drawer Overlay — opened via Brand Mark click */}
      <ExpandedSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        profile={profile}
      />

      {/* Mobile Top Navigation */}
      <MobileTopBar
        user={user}
        profile={profile}
        currentPageTitle={currentPageTitle}
        notificationCount={notificationCount}
      />

      {/* Main Content Area — Offset 68px on desktop (never obscured by rail), offset from top bar on mobile */}
      <main className={`lg:pl-[68px] lg:pt-0 p-4 lg:p-8 min-h-screen ${isOps ? 'pt-[130px]' : 'pt-[96px]'}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
