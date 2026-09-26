import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ArrowUpFromLine, CheckCircle2, ChevronRight } from 'lucide-react'
import { getDocuments, createDocument, validateDelivery } from '../services/operationsService'
import type { InventoryDocument, DocumentStatus } from '../types/inventory'
import { InlineLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { DocumentForm } from '../components/operations/DocumentForm'
import { formatDateShort } from '../lib/dateUtils'

export function DeliveriesPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<InventoryDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [_error, setError] = useState('')

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const data = await getDocuments({ type: 'delivery', status: statusFilter, search })
      setDocuments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [statusFilter, search])

  const handleCreateDelivery = async (formData: any) => {
    setSubmitting(true)
    try {
      const doc = await createDocument({
        type: 'delivery',
        partner_name: formData.partner_name,
        source_location_id: formData.source_location_id,
        notes: formData.notes,
        lines: formData.lines,
      })
      setIsModalOpen(false)
      loadDocuments()
      navigate(`/documents/${doc.id}`)
    } catch (err: any) {
      alert(`Error creating delivery: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleValidate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setActionLoadingId(id)
    try {
      await validateDelivery(id)
      await loadDocuments()
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const styles: Record<DocumentStatus, string> = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      waiting: 'bg-amber-50 text-amber-700 border-amber-200',
      ready: 'bg-blue-50 text-brand border-blue-200',
      done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      canceled: 'bg-rose-50 text-rose-700 border-rose-200',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="w-6 h-6 text-sky-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Deliveries / Outgoings</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Dispatch outgoing stock to customers or external locations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-[#0E131A] p-4 rounded-xl border border-slate-200 dark:border-[#273241] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1769FF] shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {(['all', 'draft', 'ready', 'done', 'canceled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                statusFilter === st
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-slate-50 dark:bg-zinc-950/40 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/50 hover:bg-slate-100'
              }`}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center">
          <InlineLoader message="Loading deliveries..." />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ArrowUpFromLine}
          title="No deliveries found"
          description={search ? "No deliveries match your search filter." : "Create a delivery order to dispatch stock."}
          actionLabel="Create Delivery"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950/50">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Customer / Recipient</th>
                  <th className="py-3.5 px-4">Source Location</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                      {doc.reference_no}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-zinc-200 font-semibold">
                      {doc.partner_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300">
                      {doc.source_location?.name ? (
                        <span>{doc.source_location.warehouse?.name} / <strong className="text-slate-800 dark:text-zinc-100">{doc.source_location.name}</strong></span>
                      ) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 font-medium">
                      {doc.lines?.length || 0} line(s)
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-zinc-400 text-xs">
                      {formatDateShort(doc.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status !== 'done' && doc.status !== 'canceled' && (
                          <button
                            onClick={(e) => handleValidate(e, doc.id)}
                            disabled={actionLoadingId === doc.id}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === doc.id ? 'Validating...' : 'Validate'}</span>
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0E131A] border border-slate-200 dark:border-[#273241] rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-[#273241] pb-3">
              <ArrowUpFromLine className="w-5 h-5 text-sky-500" />
              <span>Create Delivery Order</span>
            </h2>
            <DocumentForm
              type="delivery"
              onSubmit={handleCreateDelivery}
              onCancel={() => setIsModalOpen(false)}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}
