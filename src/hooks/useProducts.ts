import { useState, useEffect, useCallback } from 'react'
import { getProducts, getCategories } from '../services/productsService'
import type { Product, Category } from '../types/inventory'

export function useProducts(filters?: { search?: string; category_id?: string; stock_status?: string }, tick?: number) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [p, c] = await Promise.all([getProducts(filters), getCategories()])
      setProducts(p)
      setCategories(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.category_id, filters?.stock_status, tick])

  useEffect(() => {
    load()
  }, [load])

  return { products, categories, loading, error, refresh: load }
}
