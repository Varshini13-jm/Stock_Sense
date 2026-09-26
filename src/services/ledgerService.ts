import { supabase } from '../lib/supabase'
import type { StockMovement } from '../types/inventory'

export async function getLedger(filters?: {
  search?: string
  movement_type?: string
  location_id?: string
  product_id?: string
  limit?: number
  offset?: number
}): Promise<{ data: StockMovement[]; count: number }> {
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  // If searching by product name/sku, find matching product IDs first
  let productIds: string[] | null = null
  if (filters?.search) {
    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id')
      .or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)

    productIds = (matchedProducts ?? []).map((p) => p.id)
    // If no matching products, return empty immediately
    if (productIds.length === 0) {
      return { data: [], count: 0 }
    }
  }

  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      product:products(id, name, sku, unit_of_measure),
      location:locations(id, name, warehouse:warehouses(id, name, code)),
      document:inventory_documents(id, reference_no, type, status)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (productIds !== null) {
    query = query.in('product_id', productIds)
  }
  if (filters?.movement_type && filters.movement_type !== 'all') {
    query = query.eq('movement_type', filters.movement_type)
  }
  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id)
  }
  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as unknown as StockMovement[], count: count ?? 0 }
}

export async function getLedgerForProduct(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      location:locations(id, name, warehouse:warehouses(id, name, code)),
      document:inventory_documents(id, reference_no, type, status)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data ?? []) as unknown as StockMovement[]
}
