import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

type RefreshCallback = () => void

/**
 * Simple real-time inventory hook: subscribes to key tables and
 * calls registered refresh callbacks on changes.
 */
export function useRealtimeInventory() {
  const callbacks = useRef<Set<RefreshCallback>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const channel = supabase
      .channel('inventory-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_balances' }, () => {
        setLastUpdate(new Date())
        callbacks.current.forEach((cb) => cb())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
        setLastUpdate(new Date())
        callbacks.current.forEach((cb) => cb())
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_documents' }, () => {
        setLastUpdate(new Date())
        callbacks.current.forEach((cb) => cb())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const register = useCallback((cb: RefreshCallback) => {
    callbacks.current.add(cb)
    return () => callbacks.current.delete(cb)
  }, [])

  return { lastUpdate, register }
}

/**
 * Simple hook for polling/manual refresh strategy.
 */
export function useRefresh() {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  return { tick, refresh }
}
