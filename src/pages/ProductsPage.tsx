import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Package, ChevronRight } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useRefresh } from '../hooks/useRealtimeInventory'
import { createProduct } from '../services/productsService'
import { getLocations } from '../services/warehouseService'
import type { Category, Location, CreateProductInput } from '../types/inventory'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { StockStatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../components/ui/Toast'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tick, refresh } = useRefresh()
  const toast = useToast()

  const [search, setSearch] = useState(params.get('q') ?? '')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { products, categories, loading, error } = useProducts(
    { search, category_id: catFilter || undefined, stock_status: statusFilter || undefined },
    tick
  )

  // Product form state
  const [form, setForm] = useState<CreateProductInput>({
    name: '', sku: '', category_id: null, unit_of_measure: 'pcs', reorder_point: 0,
  })
  const [locations, setLocations] = useState<Location[]>([])
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {})
  }, [])

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.sku || !form.unit_of_measure) {
      setFormError('Name, SKU, and unit of measure are required.')
      return
    }
    if (form.initial_quantity && form.initial_quantity > 0 && !form.initial_location_id) {
      setFormError('Select a location for the initial stock.')
      return
    }
    try {
      setFormLoading(true)
      await createProduct(form)
      toast.success('Product created', `${form.name} added to inventory.`)
      setShowForm(false)
      setForm({ name: '', sku: '', category_id: null, unit_of_measure: 'pcs', reorder_point: 0 })
      refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create product.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} SKUs in system</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search name or SKU..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select-field w-auto min-w-[160px]" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select-field w-auto min-w-[140px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="normal">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        {(search || catFilter || statusFilter) && (
          <button className="btn-ghost text-gray-500" onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter('') }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No products found"
          description="Add your first product or adjust the filters."
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Add Product</button>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">SKU</th>
                    <th className="table-th">Product</th>
                    <th className="table-th">Category</th>
                    <th className="table-th text-right">Total Stock</th>
                    <th className="table-th">UOM</th>
                    <th className="table-th text-right">Reorder Pt.</th>
                    <th className="table-th">Status</th>
                    <th className="table-th w-8" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/products/${p.id}`)}>
                      <td className="table-td"><span className="font-mono text-xs font-bold text-brand">{p.sku}</span></td>
                      <td className="table-td font-semibold text-gray-900">{p.name}</td>
                      <td className="table-td text-gray-500">{(p.category as Category | null)?.name ?? '—'}</td>
                      <td className="table-td text-right font-bold">
                        <span className={p.stock_status === 'out' ? 'stock-out' : p.stock_status === 'low' ? 'stock-low' : 'stock-normal'}>
                          {p.total_stock ?? 0}
                        </span>
                      </td>
                      <td className="table-td text-gray-500">{p.unit_of_measure}</td>
                      <td className="table-td text-right text-gray-500">{p.reorder_point}</td>
                      <td className="table-td"><StockStatusBadge status={p.stock_status ?? 'normal'} /></td>
                      <td className="table-td"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="card-hover p-4" onClick={() => navigate(`/products/${p.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="font-mono text-xs text-brand mt-0.5">{p.sku}</p>
                  </div>
                  <StockStatusBadge status={p.stock_status ?? 'normal'} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-500">{(p.category as Category | null)?.name ?? '—'}</span>
                  <span className="font-bold text-gray-900">{p.total_stock ?? 0} {p.unit_of_measure}</span>
                  <span className="text-gray-400">Reorder: {p.reorder_point}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create product modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-gray-200 shadow-hard animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Product</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost px-2">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input className="input-field" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">SKU *</label>
                  <input className="input-field font-mono" required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="label">Unit of Measure *</label>
                  <input className="input-field" required value={form.unit_of_measure} onChange={(e) => setForm((f) => ({ ...f, unit_of_measure: e.target.value }))} placeholder="pcs, kg, pairs..." />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="select-field" value={form.category_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}>
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Reorder Point</label>
                  <input type="number" min="0" className="input-field" value={form.reorder_point} onChange={(e) => setForm((f) => ({ ...f, reorder_point: +e.target.value }))} />
                </div>
                <div>
                  <label className="label">Initial Stock</label>
                  <input type="number" min="0" className="input-field" placeholder="Optional" value={form.initial_quantity ?? ''} onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value ? +e.target.value : undefined }))} />
                </div>
                <div>
                  <label className="label">Initial Location</label>
                  <select className="select-field" value={form.initial_location_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, initial_location_id: e.target.value || undefined }))}>
                    <option value="">Select location</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{(l.warehouse as { name: string } | null)?.name ?? ''} / {l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 justify-center">
                  {formLoading ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
