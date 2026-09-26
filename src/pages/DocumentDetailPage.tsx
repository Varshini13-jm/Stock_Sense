import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Printer, Calendar, User, MapPin, Package, FileText, AlertCircle } from 'lucide-react'
import { getDocumentById, validateReceipt, validateDelivery, validateTransfer, validateAdjustment, updateDocumentStatus } from '../services/operationsService'
import type { InventoryDocument } from '../types/inventory'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDateShort } from '../lib/dateUtils'

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<InventoryDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDoc = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await getDocumentById(id)
      if (!data) {
        setError('Document not found')
      } else {
        setDoc(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoc()
  }, [id])

  const handleValidate = async () => {
    if (!doc) return
    setActionLoading(true)
    setError('')
    try {
      if (doc.type === 'receipt') await validateReceipt(doc.id)
      else if (doc.type === 'delivery') await validateDelivery(doc.id)
      else if (doc.type === 'transfer') await validateTransfer(doc.id)
      else if (doc.type === 'adjustment') await validateAdjustment(doc.id)
      await loadDoc()
    } catch (err: any) {
      setError(err.message || 'Validation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!doc || !confirm('Are you sure you want to cancel this document?')) return
    setActionLoading(true)
    try {
      await updateDocumentStatus(doc.id, 'canceled')
      await loadDoc()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel document')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-30 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs font-semibold text-zinc-400">Loading document details...</span>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Error Loading Document</h2>
        <p className="text-slate-600 dark:text-zinc-400 text-sm">{error || 'Document does not exist'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  const typeTitles = {
    receipt: 'Receipt / Incoming',
    delivery: 'Delivery / Outgoing',
    transfer: 'Internal Transfer',
    adjustment: 'Physical Stock Adjustment',
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to operations</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document</span>
          </button>
          {doc.status !== 'done' && doc.status !== 'canceled' && (
            <>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Document</span>
              </button>
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? 'Validating Stock...' : 'Validate Document'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Card Header */}
      <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-wider text-[#1769FF] uppercase bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                {typeTitles[doc.type]}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                doc.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                doc.status === 'canceled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                STATUS: {doc.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-2">{doc.reference_no}</h1>
          </div>

          <div className="text-right text-xs text-slate-500 dark:text-zinc-400 space-y-1">
            <div className="flex items-center justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created: {formatDateShort(doc.created_at)}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>System User</span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doc.partner_name && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/60 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Partner / Customer</span>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{doc.partner_name}</p>
            </div>
          )}
          {doc.source_location && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/60 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Source Location</span>
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                {doc.source_location.warehouse?.name} / {doc.source_location.name}
              </p>
            </div>
          )}
          {doc.destination_location && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/60 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Destination Location</span>
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                {doc.destination_location.warehouse?.name} / {doc.destination_location.name}
              </p>
            </div>
          )}
        </div>

        {doc.notes && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/80 dark:border-zinc-800/60 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Notes</span>
            </span>
            <p className="text-sm text-slate-700 dark:text-zinc-300 italic">{doc.notes}</p>
          </div>
        )}
      </div>

      {/* Document Lines Table */}
      <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-500" />
          <span>Document Items ({doc.lines?.length || 0})</span>
        </h2>

        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950/80">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-right">Demand Qty</th>
                {doc.type === 'adjustment' && <th className="py-3 px-4 text-right">Counted Qty</th>}
                {doc.type === 'adjustment' && <th className="py-3 px-4 text-right">Difference</th>}
                <th className="py-3 px-4">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
              {doc.lines?.map((line) => {
                const diff = (line.counted_quantity ?? 0) - line.quantity
                return (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 text-xs">{line.product?.sku}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-zinc-100">{line.product?.name}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-zinc-200">{line.quantity}</td>
                    {doc.type === 'adjustment' && (
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">{line.counted_quantity ?? '—'}</td>
                    )}
                    {doc.type === 'adjustment' && (
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 text-xs">{line.product?.unit_of_measure}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
