import { Building2 } from 'lucide-react'
import { InlineLoader } from '../ui/LoadingSpinner'

interface WarehouseSummaryEntry {
  id: string
  name: string
  code: string
  total: number
}

interface WarehouseCapacityProps {
  summaries: WarehouseSummaryEntry[]
  loading: boolean
}

const COLORS = ['bg-[#1769FF]', 'bg-[#FF7A00]', 'bg-[#16A34A]', 'bg-purple-500']
const TEXT_COLORS = ['text-[#1769FF]', 'text-[#FF7A00]', 'text-[#16A34A]', 'text-purple-500']

export function WarehouseCapacity({ summaries, loading }: WarehouseCapacityProps) {
  const maxTotal = Math.max(...summaries.map((s) => s.total), 1)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-[#273241]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#1769FF]" />
          <h2 className="section-title">Warehouse Stock Distribution</h2>
        </div>
        <span className="text-xs text-zinc-500 dark:text-[#94A3B8] font-semibold">{summaries.length} sites</span>
      </div>
      <div className="p-5 space-y-4">
        {loading ? (
          <InlineLoader />
        ) : summaries.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">No warehouse stock data recorded</p>
        ) : (
          summaries.map((s, i) => {
            const pct = maxTotal > 0 ? (s.total / maxTotal) * 100 : 0
            return (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>
                      {s.code}
                    </span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-[#F5F7FA]">{s.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-[#94A3B8]">{s.total.toLocaleString()} units</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-[#151B23] rounded-full overflow-hidden border border-zinc-200 dark:border-[#273241]">
                  <div
                    className={`h-full rounded-full transition-all ${COLORS[i % COLORS.length]}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
