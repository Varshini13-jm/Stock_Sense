import { useState, useEffect, useCallback } from 'react'
import { getDashboardKPIs, getRecentMovements, getPendingOperations, getLowStockAlerts, getWarehouseStockSummary } from '../services/dashboardService'
import type { DashboardKPIs, StockMovement, InventoryDocument } from '../types/inventory'

export function useDashboard(tick?: number) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [pendingOps, setPendingOps] = useState<InventoryDocument[]>([])
  const [alerts, setAlerts] = useState<ReturnType<typeof getLowStockAlerts> extends Promise<infer T> ? T : never>([])
  const [warehouseSummary, setWarehouseSummary] = useState<Awaited<ReturnType<typeof getWarehouseStockSummary>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [k, m, p, a, w] = await Promise.all([
        getDashboardKPIs(),
        getRecentMovements(10),
        getPendingOperations(10),
        getLowStockAlerts(),
        getWarehouseStockSummary(),
      ])
      setKpis(k)
      setRecentMovements(m)
      setPendingOps(p)
      setAlerts(a as typeof alerts)
      setWarehouseSummary(w)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, tick])

  return { kpis, recentMovements, pendingOps, alerts, warehouseSummary, loading, error, refresh: load }
}
