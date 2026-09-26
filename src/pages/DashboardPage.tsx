import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, RefreshCw, Wifi, AlertCircle } from 'lucide-react'
import { useDashboard } from '../hooks/useDashboard'
import { useRefresh } from '../hooks/useRealtimeInventory'
import { KpiGrid } from '../components/dashboard/KpiGrid'
import { StockAlerts } from '../components/dashboard/StockAlerts'
import { RecentMovements } from '../components/dashboard/RecentMovements'
import { PendingOperations } from '../components/dashboard/PendingOperations'
import { WarehouseCapacity } from '../components/dashboard/WarehouseCapacity'
import { isSupabaseConfigured } from '../lib/supabase'
import { formatDistanceToNow } from '../lib/dateUtils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { tick, refresh } = useRefresh()
  const { kpis, recentMovements, pendingOps, alerts, warehouseSummary, loading, error } = useDashboard(tick)
  const [search, setSearch] = useState('')
  const [lastRefreshed] = useState(new Date())

  if (!isSupabaseConfigured) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
            <Wifi className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Supabase Connection Required</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create a <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> file with your Supabase keys:
          </p>
          <pre className="text-left text-xs bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono overflow-x-auto border border-zinc-800">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="text-xs text-zinc-500">Then restart the Vite dev server.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-[#273241]/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#F5F7FA] tracking-tight">Dashboard Console</h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live inventory data
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-1">
            Real-time operational overview · Updated {formatDistanceToNow(lastRefreshed.toISOString())}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Field */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] rounded-xl text-xs text-zinc-900 dark:text-[#F5F7FA] placeholder-zinc-400 focus:outline-none focus:border-[#1769FF]"
              placeholder="Search SKU, product, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search) navigate(`/products?q=${search}`)
              }}
            />
          </div>

          <button
            onClick={refresh}
            className="p-2 rounded-xl bg-white dark:bg-[#0E131A] border border-zinc-200 dark:border-[#273241] text-zinc-700 dark:text-[#F5F7FA] hover:bg-zinc-100 dark:hover:bg-[#151B23] transition-colors"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/operations/receipts')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Operation</span>
          </button>
        </div>
      </div>

      {/* Compact Error Banner (if Supabase query fails, preserving real error details) */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Database query status: {error}</span>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <KpiGrid kpis={kpis} loading={loading} />

      {/* Main Operational Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column — 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          <PendingOperations operations={pendingOps} loading={loading} />
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">
          <StockAlerts alerts={alerts as Parameters<typeof StockAlerts>[0]['alerts']} loading={loading} />
          <WarehouseCapacity summaries={warehouseSummary} loading={loading} />
          <RecentMovements movements={recentMovements} loading={loading} />
        </div>
      </div>
    </div>
  )
}
