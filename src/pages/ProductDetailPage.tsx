import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Package } from 'lucide-react'
import { getProductById, getProductBalances } from '../services/productsService'
import { getLedgerForProduct } from '../services/ledgerService'
import type { Product, InventoryBalance, StockMovement, Category } from '../types/inventory'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { StockStatusBadge } from '../components/ui/StatusBadge'
import { formatDateTime } from '../lib/dateUtils'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [balances, setBalances] = useState<InventoryBalance[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getProductById(id),
      getProductBalances(id),
      getLedgerForProduct(id),
    ]).then(([p, b, m]) => {
      setProduct(p)
      setBalances(b)
      setMovements(m)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!product) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <p className="text-gray-500">Product not found.</p>
    </div>
  )

  const totalStock = balances.reduce((s, b) => s + b.quantity, 0)
  const stockStatus = totalStock <= 0 ? 'out' : totalStock <= product.reorder_point ? 'low' : 'normal'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')} className="btn-ghost !px-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{product.name}</h1>
            <StockStatusBadge status={stockStatus} />
          </div>
          <p className="font-mono text-sm text-brand mt-0.5">{product.sku}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/operations/receipts')} className="btn-secondary text-xs">
            <ArrowDownToLine className="w-3.5 h-3.5" /> Receipt
          </button>
          <button onClick={() => navigate('/operations/transfers')} className="btn-secondary text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
          </button>
          <button onClick={() => navigate('/operations/deliveries')} className="btn-secondary text-xs">
            <ArrowUpFromLine className="w-3.5 h-3.5" /> Delivery
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title flex items-center gap-2"><Package className="w-4 h-4 text-brand" /> Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{(product.category as Category | null)?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unit of Measure</span><span className="font-medium">{product.unit_of_measure}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reorder Point</span><span className="font-medium">{product.reorder_point} {product.unit_of_measure}</span></div>
            <div className="flex justify-between border-t pt-3"><span className="text-gray-700 font-semibold">Total Stock</span><span className={`font-extrabold text-lg ${stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-green-600'}`}>{totalStock} {product.unit_of_measure}</span></div>
          </div>
        </div>

        {/* Stock by location */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Stock by Location</h2>
          {balances.length === 0 ? (
            <p className="text-sm text-gray-400">No stock in any location.</p>
          ) : (
            <div className="space-y-3">
              {balances.map((b) => {
                const loc = b.location as { name: string; warehouse?: { name: string; code: string } } | null
                return (
                  <div key={b.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{loc?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{loc?.warehouse?.name ?? ''}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{b.quantity} <span className="text-gray-400 font-normal">{product.unit_of_measure}</span></span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent movements */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Movements</h2>
          {movements.length === 0 ? (
            <p className="text-sm text-gray-400">No movements recorded.</p>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 8).map((m) => {
                const sign = m.quantity_delta >= 0 ? '+' : ''
                const color = m.quantity_delta >= 0 ? 'text-green-600' : 'text-red-600'
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{m.movement_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(m.created_at)}</p>
                    </div>
                    <span className={`font-bold ${color}`}>{sign}{m.quantity_delta} {product.unit_of_measure}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
