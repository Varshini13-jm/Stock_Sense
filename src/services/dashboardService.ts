import { supabase } from '../lib/supabase'
import type { DashboardKPIs, InventoryDocument, StockMovement } from '../types/inventory'

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  let productsInStock = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  let pendingReceipts = 0
  let pendingDeliveries = 0
  let scheduledTransfers = 0

  try {
    // Products & stock balances
    const { data: balances, error: bError } = await supabase
      .from('inventory_balances')
      .select('product_id, quantity, product:products(id, reorder_point)')

    if (bError) console.error('[Dashboard] Error fetching balances:', bError)

    const productMap = new Map<string, { quantity: number; reorder_point: number }>()
    for (const b of balances ?? []) {
      const existing = productMap.get(b.product_id) ?? {
        quantity: 0,
        reorder_point: (b.product as unknown as { reorder_point: number } | null)?.reorder_point ?? 0,
      }
      existing.quantity += b.quantity
      productMap.set(b.product_id, existing)
    }

    for (const [, { quantity, reorder_point }] of productMap) {
      if (quantity <= 0) {
        outOfStockCount++
      } else if (quantity <= reorder_point) {
        lowStockCount++
        productsInStock++
      } else {
        productsInStock++
      }
    }
  } catch (err) {
    console.error('[Dashboard] Error calculating KPI balances:', err)
  }

  try {
    // Pending documents
    const { data: docs, error: dError } = await supabase
      .from('inventory_documents')
      .select('type, status')
      .in('status', ['draft', 'waiting', 'ready'])

    if (dError) console.error('[Dashboard] Error fetching pending docs:', dError)

    for (const doc of docs ?? []) {
      if (doc.type === 'receipt') pendingReceipts++
      else if (doc.type === 'delivery') pendingDeliveries++
      else if (doc.type === 'transfer') scheduledTransfers++
    }
  } catch (err) {
    console.error('[Dashboard] Error calculating KPI pending docs:', err)
  }

  return {
    productsInStock,
    lowStockCount,
    outOfStockCount,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
  }
}

export async function getRecentMovements(limit = 10): Promise<StockMovement[]> {
  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name, sku, unit_of_measure),
        location:locations(id, name, warehouse:warehouses(id, name, code)),
        document:inventory_documents(id, reference_no, type, status)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Dashboard] Error fetching recent movements:', error)
      return []
    }
    return (data ?? []) as unknown as StockMovement[]
  } catch (err) {
    console.error('[Dashboard] Recent movements exception:', err)
    return []
  }
}

export async function getPendingOperations(limit = 10): Promise<InventoryDocument[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_documents')
      .select(`
        *,
        source_location:locations!source_location_id(id, name, warehouse:warehouses(id, name)),
        destination_location:locations!destination_location_id(id, name, warehouse:warehouses(id, name))
      `)
      .in('status', ['draft', 'waiting', 'ready'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Fallback without explicit column hints ifPostgREST cache differs
      const { data: fallbackData } = await supabase
        .from('inventory_documents')
        .select(`*, source_location:locations(id, name), destination_location:locations(id, name)`)
        .in('status', ['draft', 'waiting', 'ready'])
        .order('created_at', { ascending: false })
        .limit(limit)

      return (fallbackData ?? []) as unknown as InventoryDocument[]
    }
    return (data ?? []) as unknown as InventoryDocument[]
  } catch (err) {
    console.error('[Dashboard] Pending operations exception:', err)
    return []
  }
}

export async function getLowStockAlerts() {
  try {
    const { data, error } = await supabase
      .from('inventory_balances')
      .select(`
        *,
        product:products(id, name, sku, unit_of_measure, reorder_point, category:categories(name)),
        location:locations(id, name, warehouse:warehouses(id, name, code))
      `)

    if (error) {
      console.error('[Dashboard] Low stock alerts error:', error)
      return []
    }

    const productTotals = new Map<string, { product: Record<string, unknown>; total: number; locations: unknown[] }>()
    for (const b of data ?? []) {
      const pid = b.product_id
      if (!productTotals.has(pid)) {
        productTotals.set(pid, { product: b.product as Record<string, unknown>, total: 0, locations: [] })
      }
      const entry = productTotals.get(pid)!
      entry.total += b.quantity
      entry.locations.push(b.location)
    }

    const alerts = []
    for (const [, { product, total }] of productTotals) {
      const reorder_point = (product as { reorder_point: number })?.reorder_point ?? 0
      if (total <= reorder_point) {
        alerts.push({
          product,
          total_quantity: total,
          reorder_point,
          status: total <= 0 ? 'out' : 'low',
        })
      }
    }

    return alerts.sort((a, b) => a.total_quantity - b.total_quantity)
  } catch (err) {
    console.error('[Dashboard] Low stock alerts exception:', err)
    return []
  }
}

export async function getWarehouseStockSummary() {
  try {
    const { data, error } = await supabase
      .from('inventory_balances')
      .select(`
        quantity,
        location:locations(id, name, warehouse_id, warehouse:warehouses(id, name, code))
      `)

    if (error) {
      console.error('[Dashboard] Warehouse stock summary error:', error)
      return []
    }

    const warehouseMap = new Map<string, { name: string; code: string; total: number }>()
    for (const b of data ?? []) {
      const loc = b.location as unknown as { warehouse: { id: string; name: string; code: string } } | null
      if (!loc?.warehouse) continue
      const wid = loc.warehouse.id
      if (!warehouseMap.has(wid)) {
        warehouseMap.set(wid, { name: loc.warehouse.name, code: loc.warehouse.code, total: 0 })
      }
      warehouseMap.get(wid)!.total += b.quantity
    }

    return Array.from(warehouseMap.entries()).map(([id, v]) => ({ id, ...v }))
  } catch (err) {
    console.error('[Dashboard] Warehouse stock summary exception:', err)
    return []
  }
}
