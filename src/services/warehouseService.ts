import { supabase } from '../lib/supabase'
import type { Warehouse, Location } from '../types/inventory'

// ─── Warehouses ───────────────────────────────────────────────────────────────

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Warehouse[]
}

export async function createWarehouse(input: {
  name: string
  code?: string
  address?: string
}): Promise<Warehouse> {
  const payload: Record<string, any> = {
    name: input.name.trim(),
    address: input.address?.trim() || null,
  }
  if (input.code) {
    payload.code = input.code.trim().toUpperCase()
  }

  let { data, error } = await supabase
    .from('warehouses')
    .insert(payload)
    .select()
    .single()

  // Gracefully fallback if the user's Supabase warehouses table doesn't have a 'code' column
  if (error && error.message?.includes("'code' column")) {
    delete payload.code
    const retry = await supabase
      .from('warehouses')
      .insert(payload)
      .select()
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) throw error
  return data as Warehouse
}

export async function updateWarehouse(
  id: string,
  input: { name?: string; code?: string; address?: string }
): Promise<Warehouse> {
  const updates: Record<string, unknown> = {}
  if (input.name) updates.name = input.name.trim()
  if (input.code) updates.code = input.code.trim().toUpperCase()
  if (input.address !== undefined) updates.address = input.address?.trim() || null

  let { data, error } = await supabase
    .from('warehouses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error && error.message?.includes("'code' column")) {
    delete updates.code
    const retry = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) throw error
  return data as Warehouse
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getLocations(warehouseId?: string): Promise<Location[]> {
  let query = supabase
    .from('locations')
    .select(`*, warehouse:warehouses(id, name)`)
    .order('name')

  if (warehouseId) query = query.eq('warehouse_id', warehouseId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Location[]
}

export async function createLocation(input: {
  warehouse_id: string
  name: string
  code?: string
}): Promise<Location> {
  const payload: Record<string, any> = {
    warehouse_id: input.warehouse_id,
    name: input.name.trim(),
    code: input.code?.trim() || null,
  }

  let { data, error } = await supabase
    .from('locations')
    .insert(payload)
    .select(`*, warehouse:warehouses(id, name)`)
    .single()

  if (error && error.message?.includes("'code' column")) {
    delete payload.code
    const retry = await supabase
      .from('locations')
      .insert(payload)
      .select(`*, warehouse:warehouses(id, name)`)
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) throw error
  return data as unknown as Location
}

export async function ensureDefaultLocation(customName?: string): Promise<Location> {
  // If customName provided or no location exists, provision warehouse & location
  const existingLocations = await getLocations()
  if (!customName && existingLocations.length > 0) {
    return existingLocations[0]
  }

  // Check if matching name already exists
  if (customName) {
    const match = existingLocations.find(l => l.name.toLowerCase() === customName.trim().toLowerCase())
    if (match) return match
  }

  // Get or create warehouse
  let warehouses = await getWarehouses()
  let warehouseId: string
  if (warehouses.length === 0) {
    const newWh = await createWarehouse({
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: 'Primary Facility',
    })
    warehouseId = newWh.id
  } else {
    warehouseId = warehouses[0].id
  }

  return await createLocation({
    warehouse_id: warehouseId,
    name: customName?.trim() || 'General Storage A',
    code: 'GEN-A',
  })
}

export async function updateLocation(
  id: string,
  input: { name?: string; code?: string }
): Promise<Location> {
  const updates: Record<string, unknown> = {}
  if (input.name) updates.name = input.name.trim()
  if (input.code !== undefined) updates.code = input.code?.trim() || null

  let { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select(`*, warehouse:warehouses(id, name)`)
    .single()

  if (error && error.message?.includes("'code' column")) {
    delete updates.code
    const retry = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select(`*, warehouse:warehouses(id, name)`)
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) throw error
  return data as unknown as Location
}

// ─── Summaries ────────────────────────────────────────────────────────────────

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
      const uniqueProducts = new Set<string>()
      const lowStockProducts = new Set<string>()

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
