import { useState, useEffect } from 'react'
import { Building2, MapPin, AlertTriangle, ChevronRight, Layers } from 'lucide-react'
import { getWarehouseSummaries, getLocationBalances } from '../services/warehouseService'
import { InlineLoader } from '../components/ui/LoadingSpinner'

export function WarehousesPage() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [locationBalances, setLocationBalances] = useState<any[]>([])
  const [loadingBalances, setLoadingBalances] = useState(false)

  useEffect(() => {
    getWarehouseSummaries()
      .then(setSummaries)
      .finally(() => setLoading(false))
  }, [])

  const handleSelectLocation = async (loc: any) => {
    setSelectedLocation(loc)
    setLoadingBalances(true)
    try {
      const data = await getLocationBalances(loc.id)
      setLocationBalances(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBalances(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Warehouses & Storage Locations</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">Multi-location stock management and storage space overview</p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <InlineLoader message="Loading warehouse structures..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summaries.map((s) => (
            <div key={s.warehouse.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{s.warehouse.name}</span>
                      <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                        {s.warehouse.code}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">{s.warehouse.address || 'Main Storage Facility'}</p>
                  </div>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 text-center">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Items</span>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{s.totalStock}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">SKU Count</span>
                  <p className="text-lg font-bold text-zinc-200 mt-0.5">{s.totalProducts}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Low Stock SKUs</span>
                  <p className={`text-lg font-bold mt-0.5 ${s.lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {s.lowStockCount}
                  </p>
                </div>
              </div>

              {/* Locations List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Locations inside {s.warehouse.name}</span>
                </span>
                <div className="space-y-2">
                  {s.locations.map((loc: any) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/50 border border-zinc-800/60 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                        <div>
                          <p className="text-sm font-semibold text-zinc-200 group-hover:text-white">{loc.name}</p>
                          {loc.code && <span className="text-xs font-mono text-zinc-500">{loc.code}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-medium">Inspect stock</span>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location Inspection Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>Stock at Location: {selectedLocation.name}</span>
                </h3>
                <p className="text-xs text-zinc-400">Available balances physically located in this bin/shelf</p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
              >
                Close
              </button>
            </div>

            {loadingBalances ? (
              <div className="py-12 text-center">
                <InlineLoader message="Fetching location inventory..." />
              </div>
            ) : locationBalances.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No active stock balances currently recorded at {selectedLocation.name}.
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/70">
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-right">Available Qty</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {locationBalances.map((b) => {
                      const isLow = b.quantity <= (b.product?.reorder_point ?? 0)
                      return (
                        <tr key={b.id} className="hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-mono text-xs text-zinc-400">{b.product?.sku}</td>
                          <td className="py-3 px-4 font-semibold text-zinc-100">{b.product?.name}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            {b.quantity} {b.product?.unit_of_measure}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800/50">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
