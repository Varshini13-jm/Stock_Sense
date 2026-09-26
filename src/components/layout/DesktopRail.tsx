import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Warehouse,
  Bell,
  History,
  Settings,
  UserCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  BookOpen,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { BrandMark } from '../ui/BrandMark'
import type { Profile } from '../../types/inventory'
import { signOut } from '../../services/authService'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface DesktopRailProps {
  user: SupabaseUser | null
  profile: Profile | null
  recents: { label: string; type: string; path: string }[]
  onExpandedOpen: () => void
  notificationCount?: number
}

type FlyoutType = 'operations' | 'recents' | 'account' | null

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: ArrowLeftRight, label: 'Operations', flyout: 'operations' as const },
  { icon: Warehouse, label: 'Warehouses', path: '/warehouses' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: History, label: 'Recents', flyout: 'recents' as const },
]

const OPERATIONS_ITEMS = [
  { icon: ArrowDownToLine, label: 'Receipts', path: '/operations/receipts' },
  { icon: ArrowUpFromLine, label: 'Deliveries', path: '/operations/deliveries' },
  { icon: ArrowLeftRight, label: 'Internal Transfers', path: '/operations/transfers' },
  { icon: SlidersHorizontal, label: 'Adjustments', path: '/operations/adjustments' },
  { icon: BookOpen, label: 'Stock Ledger', path: '/operations/ledger' },
]

export function DesktopRail({ user, profile, recents, onExpandedOpen, notificationCount = 0 }: DesktopRailProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [flyout, setFlyout] = useState<FlyoutType>(null)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setFlyout(null)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setFlyout(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  function toggleFlyout(f: FlyoutType) {
    setFlyout((prev) => (prev === f ? null : f))
  }

  function navTo(path: string) {
    navigate(path)
    setFlyout(null)
  }

  function isActive(path?: string) {
    if (!path) return false
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
    <div ref={railRef} className="fixed inset-y-0 left-0 z-40 hidden lg:flex">
      {/* 68px Icon-Only Compact Rail */}
      <div className="w-[68px] bg-white dark:bg-[#05070A] border-r border-zinc-200 dark:border-[#273241] flex flex-col items-center py-3 gap-1 shadow-sm">
        {/* Brand logo mark control (opens drawer) */}
        <button
          onClick={onExpandedOpen}
          className="w-10 h-10 flex items-center justify-center rounded-xl mb-3 hover:bg-zinc-100 dark:hover:bg-[#151B23] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1769FF]"
          title="Open Navigation Drawer"
          aria-label="Open Navigation Drawer"
        >
          <BrandMark size={28} />
        </button>

        {/* Main navigation icons ONLY */}
        <nav className="flex flex-col gap-1.5 w-full px-2 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = item.path ? isActive(item.path) : (item.flyout === 'operations' && isOpsActive())
            const flyoutOpen = item.flyout ? flyout === item.flyout : false

            return (
              <div key={item.label} className="relative group flex justify-center">
                <button
                  onClick={() => {
                    if (item.path) navTo(item.path)
                    else if (item.flyout) toggleFlyout(item.flyout)
                  }}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1769FF]
                    ${active || flyoutOpen
                      ? 'bg-[#1769FF] text-white shadow-md shadow-blue-500/20'
                      : 'text-zinc-600 dark:text-[#94A3B8] hover:bg-zinc-100 dark:hover:bg-[#151B23] hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  aria-label={item.label}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label === 'Alerts' && notificationCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF7A00] rounded-full ring-2 ring-white dark:ring-[#05070A]" />
                  )}
                </button>

                {/* Crisp side tooltip on hover/focus */}
                <div className="absolute left-[58px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-zinc-900 dark:bg-[#151B23] text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 border border-zinc-700 dark:border-[#273241]">
                  {item.label}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Bottom utility icons */}
        <div className="flex flex-col gap-1.5 w-full px-2 border-t border-zinc-200 dark:border-[#273241] pt-2">
          {/* Settings */}
          <div className="relative group flex justify-center">
            <button
              onClick={() => navTo('/settings')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1769FF]
                ${isActive('/settings')
                  ? 'bg-[#1769FF] text-white'
                  : 'text-zinc-600 dark:text-[#94A3B8] hover:bg-zinc-100 dark:hover:bg-[#151B23] hover:text-zinc-900 dark:hover:text-white'
                }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="absolute left-[58px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-zinc-900 dark:bg-[#151B23] text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 border border-zinc-700 dark:border-[#273241]">
              Settings
            </div>
          </div>

          {/* Account */}
          <div className="relative group flex justify-center">
            <button
              onClick={() => toggleFlyout('account')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1769FF]
                ${flyout === 'account'
                  ? 'ring-2 ring-[#1769FF]'
                  : 'hover:opacity-90'
                }`}
              aria-label="Account"
            >
              <div className="w-8 h-8 rounded-xl bg-[#1769FF] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initials}
              </div>
            </button>
            <div className="absolute left-[58px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-zinc-900 dark:bg-[#151B23] text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 border border-zinc-700 dark:border-[#273241]">
              Account
            </div>
          </div>
        </div>
      </div>

      {/* Operations Contextual Flyout Panel */}
      {flyout === 'operations' && (
        <div className="absolute left-[74px] top-16 w-60 bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
          <div className="px-3 pt-2 pb-1.5 border-b border-zinc-100 dark:border-[#273241]">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-[#94A3B8] uppercase tracking-wider">Inventory Operations</p>
          </div>
          {OPERATIONS_ITEMS.map((op) => (
            <button
              key={op.path}
              onClick={() => navTo(op.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left
                ${isActive(op.path)
                  ? 'bg-[#1769FF]/10 text-[#1769FF] dark:text-[#1769FF]'
                  : 'text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23]'
                }`}
            >
              <op.icon className="w-4 h-4 shrink-0 text-[#1769FF]" />
              <span>{op.label}</span>
            </button>
          ))}
          <div className="border-t border-zinc-100 dark:border-[#273241] pt-1.5 px-3 pb-1">
            <button
              onClick={() => navTo('/operations/ledger')}
              className="flex items-center gap-1.5 text-xs text-[#1769FF] font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Stock Ledger</span>
            </button>
          </div>
        </div>
      )}

      {/* Recents Contextual Flyout Panel */}
      {flyout === 'recents' && (
        <div className="absolute left-[74px] top-32 w-64 bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
          <div className="px-3 pt-2 pb-1.5 border-b border-zinc-100 dark:border-[#273241]">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-[#94A3B8] uppercase tracking-wider">Recently Viewed</p>
          </div>
          {recents.length === 0 ? (
            <p className="text-xs text-zinc-400 p-3">No recent inventory activity yet.</p>
          ) : (
            recents.slice(0, 5).map((r, i) => (
              <button
                key={i}
                onClick={() => navTo(r.path)}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-zinc-100 dark:hover:bg-[#151B23] transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#1769FF] mt-1.5 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-zinc-900 dark:text-[#F5F7FA] truncate">{r.label}</p>
                  <p className="text-[10px] text-zinc-500 capitalize">{r.type}</p>
                </div>
              </button>
            ))
          )}
          <div className="border-t border-zinc-100 dark:border-[#273241] pt-1.5 px-3 pb-1">
            <button
              onClick={() => navTo('/operations/ledger')}
              className="flex items-center gap-1.5 text-xs text-[#1769FF] font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View All Operations History</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Contextual Flyout Panel */}
      {flyout === 'account' && (
        <div className="absolute left-[74px] bottom-3 w-64 bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-2xl shadow-xl z-50 p-3 space-y-3 animate-fade-in">
          <div className="border-b border-zinc-100 dark:border-[#273241] pb-2">
            <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F7FA] truncate">{displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1769FF] bg-[#1769FF]/10 px-2 py-0.5 rounded-md">
              {profile?.role || 'Inventory Manager'}
            </span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => navTo('/profile')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23] rounded-xl transition-colors"
            >
              <UserCircle className="w-4 h-4 text-[#1769FF]" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => navTo('/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23] rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-[#1769FF]" />
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
