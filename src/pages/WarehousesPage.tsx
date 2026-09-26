import { useState, useEffect } from 'react'
import { Building2, MapPin, AlertTriangle, ChevronRight, Layers, Plus, X, CheckCircle2, Pencil } from 'lucide-react'
import {
  getWarehouseSummaries,
  getLocationBalances,
  createWarehouse,
  updateWarehouse,
  createLocation,
  updateLocation,
} from '../services/warehouseService'
import { InlineLoader } from '../components/ui/LoadingSpinner'
import { useToast } from '../components/ui/Toast'

type WarehouseSummary = {
  warehouse: { id: string; name: string; code: string; address: string | null }
  locations: { id: string; name: string; code: string | null }[]
  totalStock: number
  totalProducts: number
  lowStockCount: number
}

export function WarehousesPage() {
  const toast = useToast()
  const [summaries, setSummaries] = useState<WarehouseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [locationBalances, setLocationBalances] = useState<any[]>([])
  const [loadingBalances, setLoadingBalances] = useState(false)

  // Warehouse form
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseSummary['warehouse'] | null>(null)
  const [wName, setWName] = useState('')
  const [wCode, setWCode] = useState('')
  const [wAddress, setWAddress] = useState('')
  const [wLoading, setWLoading] = useState(false)
  const [wError, setWError] = useState('')

  // Location form
  const [showLocationForm, setShowLocationForm] = useState<string | null>(null) // warehouseId
  const [editingLocation, setEditingLocation] = useState<{ id: string; name: string; code: string | null } | null>(null)
  const [lName, setLName] = useState('')
  const [lCode, setLCode] = useState('')
  const [lLoading, setLLoading] = useState(false)
  const [lError, setLError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getWarehouseSummaries()
      setSummaries(data as WarehouseSummary[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  // Warehouse CRUD
  function openNewWarehouse() {
    setEditingWarehouse(null); setWName(''); setWCode(''); setWAddress(''); setWError('')
    setShowWarehouseForm(true)
  }
  function openEditWarehouse(w: WarehouseSummary['warehouse']) {
    setEditingWarehouse(w); setWName(w.name); setWCode(w.code || ''); setWAddress(w.address || ''); setWError('')
    setShowWarehouseForm(true)
  }
  async function handleSaveWarehouse(e: React.FormEvent) {
    e.preventDefault()
    if (!wName.trim()) { setWError('Warehouse name is required.'); return }
    setWLoading(true); setWError('')
    try {
      const codeToUse = wCode.trim() || `WH-${wName.replace(/\s+/g, '').slice(0, 4).toUpperCase()}`
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, { name: wName, code: codeToUse, address: wAddress })
        toast.success('Warehouse updated')
      } else {
        await createWarehouse({ name: wName, code: codeToUse, address: wAddress })
        toast.success('Warehouse created')
      }
      setShowWarehouseForm(false)
      load()
    } catch (err: any) {
      setWError(err.message || 'Failed to save warehouse')
    } finally {
      setWLoading(false)
    }
  }

  // Location CRUD
  function openNewLocation(warehouseId: string) {
    setEditingLocation(null); setLName(''); setLCode(''); setLError('')
    setShowLocationForm(warehouseId)
  }
  function openEditLocation(loc: { id: string; name: string; code: string | null }, warehouseId: string) {
    setEditingLocation(loc); setLName(loc.name); setLCode(loc.code || ''); setLError('')
    setShowLocationForm(warehouseId)
  }
  async function handleSaveLocation(e: React.FormEvent, warehouseId: string) {
    e.preventDefault()
    if (!lName.trim()) { setLError('Location name is required.'); return }
    setLLoading(true); setLError('')
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, { name: lName, code: lCode })
        toast.success('Location updated')
      } else {
        await createLocation({ warehouse_id: warehouseId, name: lName, code: lCode })
        toast.success('Location created')
      }
      setShowLocationForm(null)
      load()
    } catch (err: any) {
      setLError(err.message || 'Failed to save location')
    } finally {
      setLLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Warehouses & Storage Locations</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Multi-location stock management and storage space overview</p>
        </div>
        <button
          onClick={openNewWarehouse}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Warehouse
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <InlineLoader message="Loading warehouse structures..." />
        </div>
      ) : summaries.length === 0 ? (
        <div className="py-16 text-center card">
          <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 mb-4">
            <Building2 className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium">No warehouses yet. Create your first warehouse to get started.</p>
          <button onClick={openNewWarehouse} className="mt-4 btn-primary">
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summaries.map((s) => (
            <div key={s.warehouse.id} className="card space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#273241] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-brand">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{s.warehouse.name}</span>
                      {s.warehouse.code && (
                        <span className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                          {s.warehouse.code}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{s.warehouse.address || 'No address set'}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEditWarehouse(s.warehouse)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit Warehouse"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics bar */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/60 text-center">
                <div>
                  <span className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Total Items</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{s.totalStock}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-medium">SKU Count</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-200 mt-0.5">{s.totalProducts}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Low Stock SKUs</span>
                  <p className={`text-lg font-bold mt-0.5 ${s.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-400'}`}>
                    {s.lowStockCount}
                  </p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    Locations inside {s.warehouse.name}
                  </span>
                  <button
                    onClick={() => openNewLocation(s.warehouse.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {/* Inline location form */}
                {showLocationForm === s.warehouse.id && (
                  <form onSubmit={(e) => handleSaveLocation(e, s.warehouse.id)} className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">{editingLocation ? 'Edit Location' : 'New Location'}</p>
                    {lError && <p className="text-xs text-rose-500">{lError}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input-field"
                        placeholder="Location name *"
                        value={lName}
                        onChange={(e) => setLName(e.target.value)}
                        required
                      />
                      <input
                        className="input-field"
                        placeholder="Code (optional)"
                        value={lCode}
                        onChange={(e) => setLCode(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowLocationForm(null)} className="btn-secondary flex-1">Cancel</button>
                      <button type="submit" disabled={lLoading} className="btn-primary flex-1 justify-center">
                        {lLoading ? 'Saving...' : <><CheckCircle2 className="w-3.5 h-3.5" /> {editingLocation ? 'Update' : 'Add'}</>}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {s.locations.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 py-2">No locations yet. Add a location to this warehouse.</p>
                  )}
                  {s.locations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectLocation(loc)}
                        className="flex-1 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800/60 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-brand transition-colors" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-brand">{loc.name}</p>
                            {loc.code && <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">{loc.code}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 font-medium">Inspect stock</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-600 group-hover:text-brand transition-colors" />
                        </div>
                      </button>
                      <button
                        onClick={() => openEditLocation(loc, s.warehouse.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Location"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Create/Edit Modal */}
      {showWarehouseForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#273241] pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                {editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
              </h2>
              <button onClick={() => setShowWarehouseForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              {wError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-500 font-medium">{wError}</div>
              )}
              <div>
                <label className="label">Warehouse Name *</label>
                <input className="input-field" value={wName} onChange={(e) => setWName(e.target.value)} placeholder="e.g. Main Warehouse" required />
              </div>
              <div>
                <label className="label">Warehouse Code (optional)</label>
                <input className="input-field font-mono uppercase" value={wCode} onChange={(e) => setWCode(e.target.value.toUpperCase())} placeholder="e.g. WH-MAIN" />
              </div>
              <div>
                <label className="label">Address (optional)</label>
                <input className="input-field" value={wAddress} onChange={(e) => setWAddress(e.target.value)} placeholder="e.g. 123 Industrial Ave" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWarehouseForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={wLoading} className="btn-primary flex-1 justify-center">
                  {wLoading ? 'Saving...' : (editingWarehouse ? 'Update Warehouse' : 'Create Warehouse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Inspection Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#273241] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand" />
                  Stock at Location: {selectedLocation.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Available balances physically located in this bin/shelf</p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>

            {loadingBalances ? (
              <div className="py-12 text-center">
                <InlineLoader message="Fetching location inventory..." />
              </div>
            ) : locationBalances.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-zinc-400 text-sm">
                No active stock balances currently recorded at <strong>{selectedLocation.name}</strong>.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950/70">
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-right">Available Qty</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                    {locationBalances.map((b) => {
                      const isLow = b.quantity <= (b.product?.reorder_point ?? 0)
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-mono text-xs text-brand font-bold">{b.product?.sku}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">{b.product?.name}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {b.quantity} {b.product?.unit_of_measure}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
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
