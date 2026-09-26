import { useNavigate } from 'react-router-dom'
import { AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { InlineLoader } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

interface AlertItem {
  product: {
    id: string
    name: string
    sku: string
    reorder_point: number
  }
  total_quantity: number
  reorder_point: number
  status: string
}

interface StockAlertsProps {
  alerts?: AlertItem[] | null
  loading: boolean
}

export function StockAlerts({ alerts, loading }: StockAlertsProps) {
  const navigate = useNavigate()
  const safeAlerts = alerts ?? []
  const criticalCount = safeAlerts.filter((a) => a?.status === 'out').length

  return (
    <div className="card p-0 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#273241]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF7A00]" />
          <h2 className="section-title">Low Stock Alerts</h2>
        </div>
        {criticalCount > 0 && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            {criticalCount} Critical
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#273241]/60">
        {loading ? (
          <InlineLoader message="Checking stock thresholds..." />
        ) : safeAlerts.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-6 h-6 text-emerald-500" />}
            title="All stock levels healthy"
            description="No products are currently at or below reorder points."
          />
        ) : (
          safeAlerts.slice(0, 6).map((alert) => {
            if (!alert?.product) return null
            const isOut = alert.status === 'out'
            const pct = alert.reorder_point > 0
              ? Math.max(0, Math.min(100, (alert.total_quantity / (alert.reorder_point * 2)) * 100))
              : 0

            return (
              <div
                key={alert.product.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-100 dark:hover:bg-[#151B23] cursor-pointer transition-colors"
                onClick={() => navigate(`/products/${alert.product.id}`)}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                  ${isOut ? 'bg-rose-500/10 text-rose-500' : 'bg-[#FF7A00]/10 text-[#FF7A00]'}`}>
                  {isOut ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-[#F5F7FA] truncate">{alert.product.name}</p>
                    <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded
                      ${isOut ? 'bg-rose-500/10 text-rose-500' : 'bg-[#FF7A00]/10 text-[#FF7A00]'}`}>
                      {isOut ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-[#151B23] rounded-full overflow-hidden border border-zinc-200 dark:border-[#273241]">
                      <div
                        className={`h-full rounded-full ${isOut ? 'bg-rose-500' : 'bg-[#FF7A00]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8] font-mono shrink-0">
                      {alert.total_quantity} / {alert.reorder_point}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {safeAlerts.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-[#273241]">
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1769FF] hover:underline"
          >
            <span>View all {safeAlerts.length} inventory warnings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
