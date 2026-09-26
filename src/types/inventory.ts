// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  role: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  address: string | null
  created_at: string
}

export interface Location {
  id: string
  warehouse_id: string
  name: string
  code: string | null
  created_at: string
  warehouse?: Warehouse
}

export interface Product {
  id: string
  name: string
  sku: string
  category_id: string | null
  unit_of_measure: string
  reorder_point: number
  created_at: string
  updated_at: string
  category?: Category
  total_stock?: number
  stock_status?: 'normal' | 'low' | 'out'
}

export interface InventoryBalance {
  id: string
  product_id: string
  location_id: string
  quantity: number
  updated_at: string
  product?: Product
  location?: Location
}

// ─── Inventory Documents ─────────────────────────────────────────────────────

export type DocumentType = 'receipt' | 'delivery' | 'transfer' | 'adjustment'
export type DocumentStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'

export interface InventoryDocument {
  id: string
  reference_no: string
  type: DocumentType
  status: DocumentStatus
  partner_name: string | null
  source_location_id: string | null
  destination_location_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  source_location?: Location
  destination_location?: Location
  created_by_profile?: Profile
  lines?: InventoryDocumentLine[]
}

export interface InventoryDocumentLine {
  id: string
  document_id: string
  product_id: string
  quantity: number
  counted_quantity: number | null
  reason: string | null
  created_at: string
  product?: Product
}

// ─── Stock Movements ─────────────────────────────────────────────────────────

export type MovementType = 'receipt' | 'delivery' | 'transfer_in' | 'transfer_out' | 'adjustment'

export interface StockMovement {
  id: string
  document_id: string | null
  product_id: string
  location_id: string
  quantity_delta: number
  movement_type: MovementType
  reason: string | null
  created_by: string | null
  created_at: string
  product?: Product
  location?: Location
  document?: InventoryDocument
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface DashboardKPIs {
  productsInStock: number
  lowStockCount: number
  outOfStockCount: number
  pendingReceipts: number
  pendingDeliveries: number
  scheduledTransfers: number
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface CreateProductInput {
  name: string
  sku: string
  category_id: string | null
  unit_of_measure: string
  reorder_point: number
  initial_quantity?: number
  initial_location_id?: string
}

export interface CreateDocumentInput {
  type: DocumentType
  partner_name?: string
  source_location_id?: string
  destination_location_id?: string
  notes?: string
  lines: CreateDocumentLineInput[]
}

export interface CreateDocumentLineInput {
  product_id: string
  quantity: number
  counted_quantity?: number
  reason?: string
}

// ─── Recents ─────────────────────────────────────────────────────────────────

export interface RecentItem {
  id: string
  label: string
  type: 'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment'
  path: string
  timestamp: number
}

// ─── Warehouse Summary ───────────────────────────────────────────────────────

export interface WarehouseSummary {
  warehouse: Warehouse
  totalProducts: number
  lowStockCount: number
  totalStock: number
  locations: LocationSummary[]
}

export interface LocationSummary {
  location: Location
  balances: InventoryBalance[]
}
