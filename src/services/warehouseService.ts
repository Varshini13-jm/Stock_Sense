import { supabase } from '../lib/supabase'
import type { Warehouse, Location } from '../types/inventory'

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Warehouse[]
}

export async function getLocations(warehouseId?: string): Promise<Location[]> {
  let query = supabase
    .from('locations')
    .select(`*, warehouse:warehouses(id, name, code)`)
    .order('name')

  if (warehouseId) query = query.eq('warehouse_id', warehouseId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Location[]
}

export async function getWarehouseSummaries() {
  const { data: warehouses, error: wError } = await supabase
    .from('warehouses')
    .select('*')
    .order('name')

  if (wError) throw wError

  const summaries = await Promise.all(
    (warehouses ?? []).map(async (warehouse) => {
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, code')
        .eq('warehouse_id', warehouse.id)

      const locationIds = (locations ?? []).map((l) => l.id)

      let totalStock = 0
      let uniqueProducts = new Set<string>()
      let lowStockProducts = new Set<string>()

      if (locationIds.length > 0) {
        const { data: balances } = await supabase
          .from('inventory_balances')
          .select(`
            quantity, product_id,
            product:products(id, reorder_point)
          `)
          .in('location_id', locationIds)

        for (const b of balances ?? []) {
          totalStock += b.quantity
          uniqueProducts.add(b.product_id)
          const rp = (b.product as unknown as { reorder_point: number } | null)?.reorder_point ?? 0
          // We'll track globally per product - simplified here
          if (b.quantity <= rp) lowStockProducts.add(b.product_id)
        }
      }

      return {
        warehouse,
        locations: locations ?? [],
        totalStock,
        totalProducts: uniqueProducts.size,
        lowStockCount: lowStockProducts.size,
      }
    })
  )

  return summaries
}

export async function getLocationBalances(locationId: string) {
  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      *,
      product:products(id, name, sku, unit_of_measure, reorder_point, category:categories(name))
    `)
    .eq('location_id', locationId)
    .gt('quantity', 0)

  if (error) throw error
  return data ?? []
}
