import { useNavigate } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, Clock, ArrowRight } from 'lucide-react'
import type { StockMovement } from '../../types/inventory'
import { InlineLoader } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { formatDistanceToNow } from '../../lib/dateUtils'

const TYPE_CONFIG = {
  receipt:      { icon: ArrowDownToLine,   label: 'Receipt',      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  delivery:     { icon: ArrowUpFromLine,   label: 'Delivery',     color: 'text-[#FF7A00]',   bg: 'bg-[#FF7A00]/10' },
  transfer_in:  { icon: ArrowLeftRight,    label: 'Transfer In',  color: 'text-[#1769FF]',   bg: 'bg-[#1769FF]/10' },
  transfer_out: { icon: ArrowLeftRight,    label: 'Transfer Out', color: 'text-purple-500',  bg: 'bg-purple-500/10' },
  adjustment:   { icon: SlidersHorizontal, label: 'Adjustment',   color: 'text-amber-500',   bg: 'bg-amber-500/10' },
} as const

export function RecentMovements({ movements, loading }: { movements?: StockMovement[] | null; loading: boolean }) {
  const navigate = useNavigate()
  const safeMovements = movements ?? []

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#273241]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1769FF]" />
          <h2 className="section-title">Recent Movements</h2>
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          ● Live Feed
        </span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-[#273241]/60">
        {loading ? (
          <InlineLoader message="Loading movement audit log..." />
        ) : safeMovements.length === 0 ? (
          <EmptyState icon={<Clock className="w-6 h-6" />} title="No movements recorded yet" />
        ) : (
          safeMovements.slice(0, 6).map((m) => {
            if (!m) return null
            const cfg = TYPE_CONFIG[m.movement_type] ?? TYPE_CONFIG.adjustment
            const Icon = cfg.icon
            const delta = m.quantity_delta
            const sign = delta > 0 ? '+' : ''
            const product = m.product as { name: string; sku: string; unit_of_measure: string } | null
            const loc = m.location as { name: string; warehouse?: { name: string } } | null

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-100 dark:hover:bg-[#151B23] cursor-pointer transition-colors"
                onClick={() => navigate('/operations/ledger')}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-[#F5F7FA] truncate">{product?.name ?? '—'}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#94A3B8] truncate">
                    {cfg.label} · {loc?.warehouse?.name ?? ''} {loc?.name ? `/ ${loc.name}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-mono font-bold ${delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {sign}{delta} {product?.unit_of_measure ?? ''}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-[#94A3B8]">{formatDistanceToNow(m.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {safeMovements.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-[#273241]">
          <button
            onClick={() => navigate('/operations/ledger')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1769FF] hover:underline"
          >
            <span>View full stock ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
