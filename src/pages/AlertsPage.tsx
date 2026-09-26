import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Package, ArrowRight, RefreshCw } from 'lucide-react'
import { getLowStockAlerts } from '../services/dashboardService'
import { InlineLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'

interface AlertItem {
  product: {
    id: string
    name: string
    sku: string
    unit_of_measure: string
    reorder_point: number
    category?: { name: string }
  }
  total_quantity: number
  reorder_point: number
  status: 'out' | 'low'
}

export function AlertsPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'out' | 'low'>('all')

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const data = await getLowStockAlerts()
      setAlerts(data as AlertItem[])
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter)
  const outCount = alerts.filter((a) => a.status === 'out').length
  const lowCount = alerts.filter((a) => a.status === 'low').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#FF7A00]" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory Alerts</h1>
            {alerts.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF7A00] text-white text-xs font-bold">
                {alerts.length}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Products at or below their reorder level — derived from live inventory data
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="btn-secondary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {!loading && alerts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filter === 'all'
                ? 'bg-blue-500/10 border-blue-500/40'
                : 'bg-white dark:bg-[#0E131A] border-slate-200 dark:border-[#273241] hover:border-slate-300'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">All Alerts</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{alerts.length}</p>
          </div>
          <div
            onClick={() => setFilter('out')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filter === 'out'
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-white dark:bg-[#0E131A] border-slate-200 dark:border-[#273241] hover:border-rose-500/30'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Out of Stock</p>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{outCount}</p>
          </div>
          <div
            onClick={() => setFilter('low')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              filter === 'low'
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-white dark:bg-[#0E131A] border-slate-200 dark:border-[#273241] hover:border-amber-500/30'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Low Stock</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{lowCount}</p>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="py-20 text-center">
          <InlineLoader message="Loading inventory alerts..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'all' ? 'No inventory alerts' : `No ${filter === 'out' ? 'out-of-stock' : 'low-stock'} items`}
          description={
            filter === 'all'
              ? 'All products are above their reorder levels. Great job!'
              : `Switch to "All Alerts" to see other alert types.`
          }
        />
      ) : (
        <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950/50">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Current Stock</th>
                  <th className="py-3.5 px-4 text-right">Reorder Level</th>
                  <th className="py-3.5 px-4 text-right">Deficit</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                {filtered.map((alert) => {
                  const deficit = alert.reorder_point - alert.total_quantity
                  return (
                    <tr
                      key={alert.product.id}
                      onClick={() => navigate(`/products/${alert.product.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        {alert.status === 'out' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-brand">
                          {alert.product.name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 dark:text-zinc-500 mt-0.5">
                          {alert.product.sku}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400">
                        {alert.product.category?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-bold ${alert.status === 'out' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {alert.total_quantity}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500 text-xs ml-1">{alert.product.unit_of_measure}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-slate-700 dark:text-zinc-300">{alert.reorder_point}</span>
                        <span className="text-slate-400 dark:text-zinc-500 text-xs ml-1">{alert.product.unit_of_measure}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {deficit > 0 ? `-${deficit}` : '0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/receipts')
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-brand text-xs font-semibold border border-blue-200 dark:border-blue-500/30 transition-colors"
                        >
                          <Package className="w-3 h-3" />
                          Order
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 text-xs text-slate-500 dark:text-zinc-500">
            {filtered.length} alert{filtered.length !== 1 ? 's' : ''} · Derived from live inventory balances and reorder rules
          </div>
        </div>
      )}
    </div>
  )
}
