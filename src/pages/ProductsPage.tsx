import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Package, ChevronRight, Tag, Pencil, Trash2, X } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useRefresh } from '../hooks/useRealtimeInventory'
import { createProduct, updateProduct, getCategories, createCategory, updateCategory, deleteCategory } from '../services/productsService'
import { getLocations, ensureDefaultLocation } from '../services/warehouseService'
import type { Category, Location, CreateProductInput, Product } from '../types/inventory'
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

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

  // Custom Category & Location input states
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCatInput, setCustomCatInput] = useState('')
  const [isCustomLocation, setIsCustomLocation] = useState(false)
  const [customLocInput, setCustomLocInput] = useState('')

  // Category management
  const [showCatManager, setShowCatManager] = useState(false)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [catError, setCatError] = useState('')

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {})
  }, [showForm])

  function openNewProduct() {
    setEditingProduct(null)
    setForm({ name: '', sku: '', category_id: null, unit_of_measure: 'pcs', reorder_point: 0 })
    setIsCustomCategory(false)
    setCustomCatInput('')
    setIsCustomLocation(false)
    setCustomLocInput('')
    setFormError('')
    setShowForm(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setForm({
      name: p.name, sku: p.sku,
      category_id: p.category_id,
      unit_of_measure: p.unit_of_measure,
      reorder_point: p.reorder_point,
    })
    setIsCustomCategory(false)
    setCustomCatInput('')
    setIsCustomLocation(false)
    setCustomLocInput('')
    setFormError('')
    setShowForm(true)
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.sku.trim() || !form.unit_of_measure.trim()) {
      setFormError('Name, SKU, and unit of measure are required.')
      return
    }

    try {
      setFormLoading(true)

      let finalCategoryId = form.category_id

      // If user typed a custom category name, create/find it
      if (isCustomCategory && customCatInput.trim()) {
        const existingCat = categories.find(c => c.name.toLowerCase() === customCatInput.trim().toLowerCase())
        if (existingCat) {
          finalCategoryId = existingCat.id
        } else {
          const created = await createCategory(customCatInput.trim())
          finalCategoryId = created.id
        }
      }

      let finalLocationId = form.initial_location_id

      // If user has initial stock
      if (!editingProduct && form.initial_quantity && form.initial_quantity > 0) {
        if (isCustomLocation && customLocInput.trim()) {
          const loc = await ensureDefaultLocation(customLocInput.trim())
          finalLocationId = loc.id
        } else if (!finalLocationId) {
          if (locations.length > 0) {
            finalLocationId = locations[0].id
          } else {
            const loc = await ensureDefaultLocation('Main Shelf A')
            finalLocationId = loc.id
          }
        }
      }

      const productPayload: CreateProductInput = {
        ...form,
        category_id: finalCategoryId,
        initial_location_id: form.initial_quantity && form.initial_quantity > 0 ? finalLocationId : undefined,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload)
        toast.success('Product updated', `${form.name} has been updated.`)
      } else {
        await createProduct(productPayload)
        toast.success('Product created', `${form.name} added to inventory.`)
      }
      setShowForm(false)
      refresh()
    } catch (err: any) {
      console.error('[ProductsPage] save product error:', err)
      const msg = err?.message || err?.details || err?.error_description || (typeof err === 'string' ? err : 'Failed to save product.')
      setFormError(msg)
    } finally {
      setFormLoading(false)
    }
  }

  // Category manager
  async function openCatManager() {
    setShowCatManager(true)
    setCatLoading(true)
    setCatError('')
    try {
      const cats = await getCategories()
      setAllCategories(cats)
    } finally {
      setCatLoading(false)
    }
  }

  async function handleAddCat() {
    if (!newCatName.trim()) return
    setCatError('')
    try {
      const cat = await createCategory(newCatName)
      setAllCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCatName('')
      toast.success('Category created')
      refresh()
    } catch (err: any) {
      setCatError(err.message || 'Failed to create category')
    }
  }

  async function handleUpdateCat() {
    if (!editCat || !editCatName.trim()) return
    setCatError('')
    try {
      const updated = await updateCategory(editCat.id, editCatName)
      setAllCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      setEditCat(null)
      setEditCatName('')
      toast.success('Category updated')
      refresh()
    } catch (err: any) {
      setCatError(err.message || 'Failed to update category')
    }
  }

  async function handleDeleteCat(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? This only works if no products are assigned to it.`)) return
    setCatError('')
    try {
      await deleteCategory(cat.id)
      setAllCategories((prev) => prev.filter((c) => c.id !== cat.id))
      toast.success('Category deleted')
      refresh()
    } catch (err: any) {
      setCatError(err.message || 'Failed to delete category')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{products.length} SKUs in system</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCatManager}
            className="btn-secondary"
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button onClick={openNewProduct} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
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
          action={<button onClick={openNewProduct} className="btn-primary">Add Product</button>}
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
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/products/${p.id}`)}>
                      <td className="table-td"><span className="font-mono text-xs font-bold text-brand">{p.sku}</span></td>
                      <td className="table-td font-semibold text-gray-900 dark:text-zinc-100">{p.name}</td>
                      <td className="table-td text-gray-500 dark:text-zinc-400">{(p.category as Category | null)?.name ?? '—'}</td>
                      <td className="table-td text-right font-bold">
                        <span className={p.stock_status === 'out' ? 'stock-out' : p.stock_status === 'low' ? 'stock-low' : 'stock-normal'}>
                          {p.total_stock ?? 0}
                        </span>
                      </td>
                      <td className="table-td text-gray-500 dark:text-zinc-400">{p.unit_of_measure}</td>
                      <td className="table-td text-right text-gray-500 dark:text-zinc-400">{p.reorder_point}</td>
                      <td className="table-td"><StockStatusBadge status={p.stock_status ?? 'normal'} /></td>
                      <td className="table-td">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
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
                    <p className="font-bold text-gray-900 dark:text-zinc-100 truncate">{p.name}</p>
                    <p className="font-mono text-xs text-brand mt-0.5">{p.sku}</p>
                  </div>
                  <StockStatusBadge status={p.stock_status ?? 'normal'} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">{(p.category as Category | null)?.name ?? '—'}</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-100">{p.total_stock ?? 0} {p.unit_of_measure}</span>
                  <span className="text-gray-400 dark:text-zinc-500">Reorder: {p.reorder_point}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Product Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E131A] rounded-2xl border border-slate-200 dark:border-[#273241] shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#273241]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/30 rounded-xl px-4 py-3 text-xs text-red-600 dark:text-rose-400 font-medium">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input className="input-field" placeholder="e.g. Samsung Galaxy A23" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">SKU *</label>
                  <input className="input-field font-mono" placeholder="e.g. PROD-001" required value={form.sku}
                    disabled={!!editingProduct}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} />
                  {editingProduct && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">SKU cannot be changed after creation.</p>}
                </div>
                <div>
                  <label className="label">Unit of Measure *</label>
                  <input className="input-field" required value={form.unit_of_measure} onChange={(e) => setForm((f) => ({ ...f, unit_of_measure: e.target.value }))} placeholder="pcs, kg, units, boxes..." />
                </div>

                {/* Category Field with Select or Type Yourself */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[11px] font-semibold text-brand hover:underline"
                    >
                      {isCustomCategory ? 'Select existing' : '+ Type custom'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      className="input-field"
                      placeholder="Type category name..."
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <select
                      className="select-field"
                      value={form.category_id ?? ''}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true)
                        } else {
                          setForm((f) => ({ ...f, category_id: e.target.value || null }))
                        }
                      }}
                    >
                      <option value="">None</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="__custom__">+ Type new category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="label">Reorder Point</label>
                  <input type="number" min="0" className="input-field" value={form.reorder_point} onChange={(e) => setForm((f) => ({ ...f, reorder_point: +e.target.value }))} />
                </div>

                {!editingProduct && (
                  <>
                    <div>
                      <label className="label">Initial Stock (Optional)</label>
                      <input type="number" min="0" className="input-field" placeholder="0" value={form.initial_quantity ?? ''} onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value ? +e.target.value : undefined }))} />
                    </div>

                    {/* Initial Location with Select or Type Yourself */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Initial Location</label>
                        <button
                          type="button"
                          onClick={() => setIsCustomLocation(!isCustomLocation)}
                          className="text-[11px] font-semibold text-brand hover:underline"
                        >
                          {isCustomLocation ? 'Select existing' : '+ Type custom'}
                        </button>
                      </div>
                      {isCustomLocation ? (
                        <input
                          className="input-field"
                          placeholder="Type location name (e.g. Shelf A)..."
                          value={customLocInput}
                          onChange={(e) => setCustomLocInput(e.target.value)}
                        />
                      ) : (
                        <select
                          className="select-field"
                          value={form.initial_location_id ?? ''}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsCustomLocation(true)
                            } else {
                              setForm((f) => ({ ...f, initial_location_id: e.target.value || undefined }))
                            }
                          }}
                        >
                          <option value="">Auto-assign default location</option>
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>
                              {(l.warehouse as { name: string } | null)?.name ?? 'Warehouse'} / {l.name}
                            </option>
                          ))}
                          <option value="__custom__">+ Type new location...</option>
                        </select>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 justify-center">
                  {formLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCatManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0E131A] rounded-2xl border border-slate-200 dark:border-[#273241] shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#273241]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand" /> Manage Categories
              </h2>
              <button onClick={() => { setShowCatManager(false); setCatError('') }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {catError && (
                <div className="bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/30 rounded-xl px-4 py-3 text-xs text-red-600 dark:text-rose-400 font-medium">
                  {catError}
                </div>
              )}

              {/* Add new category */}
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="New category name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCat() } }}
                />
                <button onClick={handleAddCat} disabled={!newCatName.trim()} className="btn-primary whitespace-nowrap">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {catLoading ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">Loading categories...</p>
              ) : allCategories.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">No categories yet. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {allCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-[#273241] bg-slate-50 dark:bg-[#151B23]">
                      {editCat?.id === cat.id ? (
                        <>
                          <input
                            className="input-field flex-1"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUpdateCat() } }}
                            autoFocus
                          />
                          <button onClick={handleUpdateCat} className="btn-primary px-2.5 py-1.5 text-xs">Save</button>
                          <button onClick={() => { setEditCat(null); setEditCatName('') }} className="btn-ghost px-2 py-1.5"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-zinc-200">{cat.name}</span>
                          <button onClick={() => { setEditCat(cat); setEditCatName(cat.name) }} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Rename">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCat(cat)} className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
