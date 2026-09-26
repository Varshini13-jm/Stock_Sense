import { useNavigate } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import type { InventoryDocument } from '../../types/inventory'
import { InlineLoader } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDistanceToNow } from '../../lib/dateUtils'

const TYPE_CONFIG = {
  receipt:    { icon: ArrowDownToLine,   label: 'Receipt',    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  delivery:   { icon: ArrowUpFromLine,   label: 'Delivery',   color: 'text-[#FF7A00]',   bg: 'bg-[#FF7A00]/10' },
  transfer:   { icon: ArrowLeftRight,    label: 'Transfer',   color: 'text-[#1769FF]',   bg: 'bg-[#1769FF]/10' },
  adjustment: { icon: SlidersHorizontal, label: 'Adjustment', color: 'text-purple-500',  bg: 'bg-purple-500/10' },
} as const

interface PendingOperationsProps {
  operations: InventoryDocument[]
  loading: boolean
}

export function PendingOperations({ operations, loading }: PendingOperationsProps) {
  const navigate = useNavigate()

  function navToDoc(doc: InventoryDocument) {
    const paths: Record<string, string> = {
      receipt: '/operations/receipts',
      delivery: '/operations/deliveries',
      transfer: '/operations/transfers',
      adjustment: '/operations/adjustments',
    }
    navigate(paths[doc.type] ?? '/dashboard')
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#273241]">
        <h2 className="section-title">Pending Operations</h2>
        <span className="text-xs text-zinc-500 dark:text-[#94A3B8] font-semibold">{operations.length} pending</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        {loading ? (
          <InlineLoader />
        ) : operations.length === 0 ? (
          <EmptyState icon={<ArrowDownToLine className="w-6 h-6" />} title="No pending operations" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-th">Type</th>
                <th className="table-th">Reference</th>
                <th className="table-th">Partner</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#273241]/60">
              {operations.map((op) => {
                const cfg = TYPE_CONFIG[op.type]
                const Icon = cfg.icon
                return (
                  <tr
                    key={op.id}
                    className="hover:bg-zinc-100 dark:hover:bg-[#151B23] cursor-pointer transition-colors"
                    onClick={() => navToDoc(op)}
                  >
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-[#F5F7FA] capitalize">{op.type}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-xs font-bold text-[#1769FF]">{op.reference_no}</span>
                    </td>
                    <td className="table-td text-zinc-600 dark:text-zinc-300">{op.partner_name ?? '—'}</td>
                    <td className="table-td"><StatusBadge status={op.status} /></td>
                    <td className="table-td text-zinc-400 text-xs">{formatDistanceToNow(op.created_at)}</td>
                    <td className="table-td">
                      <ArrowUpRight className="w-4 h-4 text-zinc-400" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-zinc-100 dark:divide-[#273241]/60">
        {loading ? (
          <InlineLoader />
        ) : operations.length === 0 ? (
          <EmptyState icon={<ArrowDownToLine className="w-6 h-6" />} title="No pending operations" />
        ) : (
          operations.map((op) => {
            const cfg = TYPE_CONFIG[op.type]
            const Icon = cfg.icon
            return (
              <div
                key={op.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-[#151B23] cursor-pointer"
                onClick={() => navToDoc(op)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1769FF]">{op.reference_no}</span>
                    <StatusBadge status={op.status} />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-[#94A3B8] mt-0.5">{op.partner_name ?? op.type} · {formatDistanceToNow(op.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
