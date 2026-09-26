import type { DocumentStatus, DocumentType, MovementType } from '../../types/inventory'

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'badge-draft' },
  waiting:  { label: 'Waiting',  className: 'badge-waiting' },
  ready:    { label: 'Ready',    className: 'badge-ready' },
  done:     { label: 'Done',     className: 'badge-done' },
  canceled: { label: 'Canceled', className: 'badge-canceled' },
}

const TYPE_CONFIG: Record<DocumentType, { label: string; className: string }> = {
  receipt:    { label: 'Receipt',    className: 'badge-receipt' },
  delivery:   { label: 'Delivery',   className: 'badge-delivery' },
  transfer:   { label: 'Transfer',   className: 'badge-transfer' },
  adjustment: { label: 'Adjustment', className: 'badge-adjustment' },
}

const MOVEMENT_CONFIG: Record<MovementType, { label: string; sign: '+' | '-' | '±'; color: string }> = {
  receipt:      { label: 'Receipt',       sign: '+', color: 'text-green-600' },
  delivery:     { label: 'Delivery',      sign: '-', color: 'text-red-600' },
  transfer_in:  { label: 'Transfer In',   sign: '+', color: 'text-blue-600' },
  transfer_out: { label: 'Transfer Out',  sign: '-', color: 'text-orange-600' },
  adjustment:   { label: 'Adjustment',    sign: '±', color: 'text-purple-600' },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'badge-draft' }
  return <span className={cfg.className}>{cfg.label}</span>
}

export function TypeBadge({ type }: { type: DocumentType }) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, className: 'badge-draft' }
  return <span className={cfg.className}>{cfg.label}</span>
}

export function MovementBadge({ type, delta }: { type: MovementType; delta: number }) {
  const cfg = MOVEMENT_CONFIG[type] ?? { label: type, sign: '±', color: 'text-gray-600' }
  const sign = delta > 0 ? '+' : delta < 0 ? '' : '±'
  return (
    <span className={`font-bold text-sm ${cfg.color}`}>
      {sign}{delta}
    </span>
  )
}

export function StockStatusBadge({ status }: { status: 'normal' | 'low' | 'out' }) {
  if (status === 'out') return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Out of Stock</span>
  if (status === 'low') return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Low Stock</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">In Stock</span>
}
