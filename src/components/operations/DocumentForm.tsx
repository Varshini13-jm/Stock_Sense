import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { getLocations } from '../../services/warehouseService'
import { getProducts } from '../../services/productsService'
import { getStockAtLocation } from '../../services/operationsService'
import type { Location, Product, CreateDocumentLineInput, DocumentType } from '../../types/inventory'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface DocumentLine extends CreateDocumentLineInput {
  _key: string
  _availableStock?: number
  _productName?: string
  _unit?: string
  counted_quantity?: number
  reason?: string
}

interface DocumentFormProps {
  type: DocumentType
  onSubmit: (data: {
    partner_name?: string
    source_location_id?: string
    destination_location_id?: string
    notes?: string
    lines: CreateDocumentLineInput[]
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function DocumentForm({ type, onSubmit, onCancel, loading = false }: DocumentFormProps) {
  const [partnerName, setPartnerName] = useState('')
  const [sourceLocId, setSourceLocId] = useState('')
  const [destLocId, setDestLocId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DocumentLine[]>([{ _key: '1', product_id: '', quantity: 1 }])
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getLocations(), getProducts()]).then(([locs, prods]) => {
      setLocations(locs)
      setProducts(prods)
    })
  }, [])

  async function updateLineStock(lineKey: string, productId: string, locationId: string) {
    if (!productId || !locationId) return
    const stock = await getStockAtLocation(productId, locationId)
    setLines((prev) => prev.map((l) => l._key === lineKey ? { ...l, _availableStock: stock } : l))
  }

  function addLine() {
    setLines((prev) => [...prev, { _key: Date.now().toString(), product_id: '', quantity: 1 }])
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l._key !== key))
  }

  function updateLine(key: string, field: Partial<DocumentLine>) {
    setLines((prev) => prev.map((l) => l._key === key ? { ...l, ...field } : l))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (type === 'transfer' && sourceLocId === destLocId && sourceLocId) {
      setError('Source and destination locations must be different.')
      return
    }
    if (!lines.every((l) => l.product_id && l.quantity > 0)) {
      setError('All lines must have a product and quantity > 0.')
      return
    }
    if (type === 'adjustment' && !lines.every((l) => l.reason)) {
      setError('All adjustment lines require a reason.')
      return
    }

    const cleanLines: CreateDocumentLineInput[] = lines.map((l) => ({
      product_id: l.product_id,
      quantity: l.quantity,
      counted_quantity: l.counted_quantity ?? undefined,
      reason: l.reason ?? undefined,
    }))

    await onSubmit({
      partner_name: partnerName || undefined,
      source_location_id: sourceLocId || undefined,
      destination_location_id: destLocId || undefined,
      notes: notes || undefined,
      lines: cleanLines,
    })
  }

  const needsSource = type === 'delivery' || type === 'transfer' || type === 'adjustment'
  const needsDest = type === 'receipt' || type === 'transfer'
  const showPartner = type === 'receipt' || type === 'delivery'
  const showCounted = type === 'adjustment'


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showPartner && (
          <div className="sm:col-span-2">
            <label className="label">{type === 'receipt' ? 'Supplier Name' : 'Customer / Destination'}</label>
            <input className="input-field" value={partnerName} onChange={(e) => setPartnerName(e.target.value)}
              placeholder={type === 'receipt' ? 'e.g. Acme Supplies' : 'e.g. Client ABC'} />
          </div>
        )}

        {needsDest && (
          <div>
            <label className="label">{type === 'transfer' ? 'Destination Location' : 'Destination Location'}</label>
            <select className="select-field" value={destLocId} onChange={(e) => setDestLocId(e.target.value)} required={type !== 'transfer'}>
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l.warehouse as { name: string } | null)?.name ?? ''} / {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsSource && (
          <div>
            <label className="label">{type === 'adjustment' ? 'Location to Adjust' : 'Source Location'}</label>
            <select className="select-field" value={sourceLocId}
              onChange={(e) => {
                setSourceLocId(e.target.value)
                lines.forEach((l) => { if (l.product_id) updateLineStock(l._key, l.product_id, e.target.value) })
              }}
              required>
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l.warehouse as { name: string } | null)?.name ?? ''} / {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="label">Notes (optional)</label>
          <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." />
        </div>
      </div>

      {/* Lines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label !mb-0">Product Lines</label>
          <button type="button" onClick={addLine} className="btn-ghost text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Line
          </button>
        </div>
        <div className="space-y-3">
          {lines.map((line, idx) => {
            const product = products.find((p) => p.id === line.product_id)
            return (
              <div key={line._key} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">LINE {idx + 1}</span>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(line._key)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label">Product</label>
                    <select className="select-field" required value={line.product_id}
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value)
                        updateLine(line._key, {
                          product_id: e.target.value,
                          _productName: prod?.name,
                          _unit: prod?.unit_of_measure,
                        })
                        if (sourceLocId) updateLineStock(line._key, e.target.value, sourceLocId)
                      }}>
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity {product ? `(${product.unit_of_measure})` : ''}</label>
                    <input type="number" min="0.001" step="any" required className="input-field"
                      value={line.quantity}
                      onChange={(e) => updateLine(line._key, { quantity: +e.target.value })} />
                  </div>
                  {showCounted && (
                    <div>
                      <label className="label">Physical Count</label>
                      <input type="number" min="0" step="any" className="input-field"
                        placeholder="Counted qty"
                        value={line.counted_quantity ?? ''}
                        onChange={(e) => updateLine(line._key, { counted_quantity: e.target.value ? +e.target.value : undefined })} />
                    </div>
                  )}
                  {(type === 'adjustment' || type === 'transfer') && (
                    <div className="sm:col-span-2">
                      <label className="label">Reason {type === 'adjustment' ? '*' : '(optional)'}</label>
                      <input className="input-field" required={type === 'adjustment'}
                        placeholder={type === 'adjustment' ? 'e.g. Physical count discrepancy' : 'e.g. Production need'}
                        value={line.reason ?? ''}
                        onChange={(e) => updateLine(line._key, { reason: e.target.value })} />
                    </div>
                  )}
                </div>
                {needsSource && line._availableStock !== undefined && (
                  <p className="text-xs text-gray-500">
                    Available at source: <strong className={line._availableStock < line.quantity ? 'text-red-600' : 'text-green-600'}>{line._availableStock} {product?.unit_of_measure ?? ''}</strong>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading && <LoadingSpinner size="sm" />}
          {loading ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </form>
  )
}
