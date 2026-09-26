import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ArrowLeftRight, Warehouse, Bell, History,
  Settings, LogOut, UserCircle, ChevronDown, ChevronRight,
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, BookOpen, X,
} from 'lucide-react'
import { BrandMark } from '../ui/BrandMark'
import type { Profile } from '../../types/inventory'
import { signOut } from '../../services/authService'
import type { User } from '@supabase/supabase-js'

interface ExpandedSidebarProps {
  open: boolean
  onClose: () => void
  user: User | null
  profile: Profile | null
}

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/products' },
  {
    icon: ArrowLeftRight, label: 'Operations', children: [
      { icon: ArrowDownToLine, label: 'Receipts', path: '/operations/receipts' },
      { icon: ArrowUpFromLine, label: 'Deliveries', path: '/operations/deliveries' },
      { icon: ArrowLeftRight, label: 'Internal Transfers', path: '/operations/transfers' },
      { icon: SlidersHorizontal, label: 'Adjustments', path: '/operations/adjustments' },
      { icon: BookOpen, label: 'Stock Ledger', path: '/operations/ledger' },
    ],
  },
  { icon: Warehouse, label: 'Warehouses', path: '/warehouses' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: History, label: 'Recents', path: '/operations/ledger' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: UserCircle, label: 'Account', path: '/profile' },
]

export function ExpandedSidebar({ open, onClose, user, profile }: ExpandedSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [opsOpen, setOpsOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose])

  function navTo(path: string) {
    navigate(path)
    onClose()
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
    onClose()
  }

  if (!open) return null

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <>
      {/* Backdrop — overlay over dashboard */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in hidden lg:block" onClick={onClose} />

      {/* Drawer Overlay Panel — overlays content, does NOT push content */}
      <div
        ref={ref}
        className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-[#05070A] border-r border-zinc-200 dark:border-[#273241] flex flex-col shadow-2xl animate-slide-right hidden lg:flex"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#273241]">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">StockSense</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#151B23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Header */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-[#273241]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1769FF] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map((item) => {
            if ('children' in item) {
              const opsActive = location.pathname.startsWith('/operations')
              return (
                <div key="operations" className="space-y-1">
                  <button
                    onClick={() => setOpsOpen((o) => !o)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors
                      ${opsActive
                        ? 'bg-[#1769FF]/10 text-[#1769FF]'
                        : 'text-zinc-700 dark:text-[#94A3B8] hover:bg-zinc-100 dark:hover:bg-[#151B23] hover:text-zinc-900 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4.5 h-4.5 text-[#1769FF]" />
                      <span>{item.label}</span>
                    </div>
                    {opsOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </button>
                  {opsOpen && (
                    <div className="ml-5 border-l border-zinc-200 dark:border-[#273241] pl-3 space-y-1 my-1">
                      {item.children?.map((child) => (
                        <button
                          key={child.path}
                          onClick={() => navTo(child.path)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors
                            ${location.pathname === child.path
                              ? 'text-[#1769FF] font-bold bg-[#1769FF]/10'
                              : 'text-zinc-600 dark:text-[#94A3B8] hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            const active = 'path' in item && (location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
            return (
              <button
                key={item.label}
                onClick={() => 'path' in item && navTo(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors
                  ${active
                    ? 'bg-[#1769FF] text-white shadow-md shadow-blue-500/20'
                    : 'text-zinc-700 dark:text-[#94A3B8] hover:bg-zinc-100 dark:hover:bg-[#151B23] hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-zinc-200 dark:border-[#273241]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
