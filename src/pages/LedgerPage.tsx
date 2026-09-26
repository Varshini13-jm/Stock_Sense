import { useState, useEffect } from 'react'
import { Search, Filter, History, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, MapPin } from 'lucide-react'
import { getLedger } from '../services/ledgerService'
import { getLocations } from '../services/warehouseService'
import type { StockMovement, Location } from '../types/inventory'
import { InlineLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDateShort } from '../lib/dateUtils'

export function LedgerPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    getLocations().then(setLocations)
  }, [])

  const loadLedger = async () => {
    setLoading(true)
    try {
      const res = await getLedger({
        search,
        movement_type: typeFilter,
        location_id: locationFilter || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setMovements(res.data)
      setTotalCount(res.count)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLedger()
  }, [search, typeFilter, locationFilter, page])

  const getMovementTypeBadge = (type: string, delta: number) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 text-xs">
            <ArrowDownToLine className="w-3 h-3" /> Receipt (+{delta})
          </span>
        )
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20 text-xs">
            <ArrowUpFromLine className="w-3 h-3" /> Delivery ({delta})
          </span>
        )
      case 'transfer_in':
        return (
          <span className="inline-flex items-center gap-1 text-purple-400 font-semibold bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 text-xs">
            <ArrowLeftRight className="w-3 h-3" /> Transfer In (+{delta})
          </span>
        )
      case 'transfer_out':
        return (
          <span className="inline-flex items-center gap-1 text-purple-300 font-semibold bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20 text-xs">
            <ArrowLeftRight className="w-3 h-3" /> Transfer Out ({delta})
          </span>
        )
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 text-xs">
            <SlidersHorizontal className="w-3 h-3" /> Adjustment ({delta > 0 ? `+${delta}` : delta})
          </span>
        )
      default:
        return <span className="text-zinc-400 text-xs">{type}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Stock Movement Ledger</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Complete immutable audit trail of all inventory transactions</p>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search movement by product name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
              className="bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.warehouse?.name} / {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            {(['all', 'receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                  typeFilter === t
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/50 hover:bg-zinc-800/50'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="py-20 text-center">
          <InlineLoader message="Loading movement ledger..." />
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={History}
          title="No stock movements found"
          description="Stock movements will appear here automatically when receipts, deliveries, transfers, or adjustments are validated."
        />
      ) : (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/50">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Quantity Delta</th>
                  <th className="py-3.5 px-4">Reference Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-zinc-400">
                      {formatDateShort(m.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      {getMovementTypeBadge(m.movement_type, m.quantity_delta)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-100">{m.product?.name}</div>
                      <div className="text-xs font-mono text-zinc-500">{m.product?.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 text-xs">
                      {m.location?.warehouse?.name} / <strong className="text-zinc-200">{m.location?.name}</strong>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${
                      m.quantity_delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta} {m.product?.unit_of_measure}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                      {m.document?.reference_no || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/40 text-xs text-zinc-400">
            <div>
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} movements
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Previous
              </button>
              <span className="font-medium text-zinc-300">Page {page}</span>
              <button
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
