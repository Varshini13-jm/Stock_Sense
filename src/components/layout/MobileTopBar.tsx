import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, LogOut, Settings, UserCircle, X } from 'lucide-react'
import { BrandMark } from '../ui/BrandMark'
import type { Profile } from '../../types/inventory'
import { signOut } from '../../services/authService'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface MobileTopBarProps {
  user: SupabaseUser | null
  profile: Profile | null
  currentPageTitle: string
  notificationCount?: number
}

const PRIMARY_NAV = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Products', path: '/products' },
  { label: 'Operations', path: '/operations/receipts', isOps: true },
  { label: 'Warehouses', path: '/warehouses' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Recents', path: '/operations/ledger' },
]

const SECONDARY_OPS_NAV = [
  { label: 'Receipts', path: '/operations/receipts' },
  { label: 'Deliveries', path: '/operations/deliveries' },
  { label: 'Transfers', path: '/operations/transfers' },
  { label: 'Adjustments', path: '/operations/adjustments' },
  { label: 'Ledger', path: '/operations/ledger' },
]

export function MobileTopBar({ user, profile, currentPageTitle, notificationCount = 0 }: MobileTopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [accountSheet, setAccountSheet] = useState(false)

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  function isOpsActive() {
    return location.pathname.startsWith('/operations')
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* Top Mobile App Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-[#05070A] border-b border-zinc-200 dark:border-[#273241] shadow-xs">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <BrandMark size={26} />
            <span className="font-bold text-sm text-zinc-900 dark:text-white">StockSense</span>
          </button>
          
          <h1 className="flex-1 text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate text-right border-l border-zinc-200 dark:border-[#273241] pl-2">
            {currentPageTitle}
          </h1>

          <button
            className="relative p-2 rounded-xl text-zinc-600 dark:text-[#94A3B8] hover:bg-zinc-100 dark:hover:bg-[#151B23] transition-colors"
            onClick={() => navigate('/alerts')}
            aria-label="Alerts"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7A00] rounded-full" />
            )}
          </button>

          <button
            className="w-8 h-8 rounded-xl bg-[#1769FF] text-white flex items-center justify-center text-xs font-bold shadow-sm"
            onClick={() => setAccountSheet(true)}
            aria-label="Account Menu"
          >
            {initials}
          </button>
        </div>

        {/* Primary Horizontally Scrollable Navigation */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-zinc-200 dark:border-[#273241] px-2 bg-zinc-50/50 dark:bg-[#070A0E]/50">
          {PRIMARY_NAV.map((item) => {
            const active = item.isOps ? isOpsActive() : isActive(item.path)
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors
                  ${active
                    ? 'text-[#1769FF] border-[#1769FF]'
                    : 'text-zinc-600 dark:text-[#94A3B8] border-transparent hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Secondary Operations Horizontal Navigation (visible when inside /operations) */}
        {isOpsActive() && (
          <div className="flex overflow-x-auto no-scrollbar border-t border-zinc-200 dark:border-[#273241] bg-blue-50/40 dark:bg-[#151B23]/40 px-2 py-1">
            {SECONDARY_OPS_NAV.map((sub) => {
              const subActive = location.pathname === sub.path
              return (
                <button
                  key={sub.path}
                  onClick={() => navigate(sub.path)}
                  className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors mr-1
                    ${subActive
                      ? 'bg-[#1769FF] text-white shadow-xs'
                      : 'text-zinc-600 dark:text-[#94A3B8] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                  {sub.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Account Mobile Bottom Sheet */}
      {accountSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAccountSheet(false)} />
          <div className="relative w-full bg-white dark:bg-[#0E131A] rounded-t-2xl border-t border-zinc-200 dark:border-[#273241] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-[#273241]">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
              <button onClick={() => setAccountSheet(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              <button
                onClick={() => { navigate('/profile'); setAccountSheet(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23] rounded-xl"
              >
                <UserCircle className="w-4.5 h-4.5 text-[#1769FF]" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { navigate('/settings'); setAccountSheet(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23] rounded-xl"
              >
                <Settings className="w-4 h-4 text-[#1769FF]" />
                <span>Settings</span>
              </button>
              <div className="border-t border-zinc-100 dark:border-[#273241] my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
