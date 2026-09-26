import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, SlidersHorizontal, CheckCircle2, ChevronRight } from 'lucide-react'
import { getDocuments, createDocument, validateAdjustment } from '../services/operationsService'
import type { InventoryDocument, DocumentStatus } from '../types/inventory'
import { InlineLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { DocumentForm } from '../components/operations/DocumentForm'
import { formatDateShort } from '../lib/dateUtils'

export function AdjustmentsPage() {
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
      const data = await getDocuments({ type: 'adjustment', status: statusFilter, search })
      setDocuments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load adjustments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [statusFilter, search])

  const handleCreateAdjustment = async (formData: any) => {
    setSubmitting(true)
    try {
      const doc = await createDocument({
        type: 'adjustment',
        source_location_id: formData.source_location_id,
        notes: formData.notes,
        lines: formData.lines,
      })
      setIsModalOpen(false)
      loadDocuments()
      navigate(`/documents/${doc.id}`)
    } catch (err: any) {
      alert(`Error creating adjustment: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleValidate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setActionLoadingId(id)
    try {
      await validateAdjustment(id)
      await loadDocuments()
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const styles: Record<DocumentStatus, string> = {
      draft: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      waiting: 'bg-amber-950/60 text-amber-400 border-amber-800/50',
      ready: 'bg-blue-950/60 text-blue-400 border-blue-800/50',
      done: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
      canceled: 'bg-rose-950/60 text-rose-400 border-rose-800/50',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
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
            <SlidersHorizontal className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Physical Inventory Adjustments</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Reconcile physical stock counts with theoretical system quantities</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by reference #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-1" />
          {(['all', 'draft', 'ready', 'done', 'canceled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                statusFilter === st
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/50 hover:bg-zinc-800/50'
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
          <InlineLoader message="Loading physical adjustments..." />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No stock adjustments found"
          description={search ? "No adjustments match your search filter." : "Perform physical count reconciliation to adjust stock."}
          actionLabel="New Adjustment"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/50">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Items Counted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-amber-400 group-hover:underline">
                      {doc.reference_no}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {doc.source_location?.name ? (
                        <span>{doc.source_location.warehouse?.name} / <strong>{doc.source_location.name}</strong></span>
                      ) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {doc.lines?.length || 0} line(s)
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 text-xs">
                      {formatDateShort(doc.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status !== 'done' && doc.status !== 'canceled' && (
                          <button
                            onClick={(e) => handleValidate(e, doc.id)}
                            disabled={actionLoadingId === doc.id}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === doc.id ? 'Validating...' : 'Validate'}</span>
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <span>Create Physical Adjustment</span>
            </h2>
            <DocumentForm
              type="adjustment"
              onSubmit={handleCreateAdjustment}
              onCancel={() => setIsModalOpen(false)}
              loading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}
