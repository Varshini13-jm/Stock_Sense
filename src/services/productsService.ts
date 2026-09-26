import { supabase } from '../lib/supabase'
import type { Product, Category, InventoryBalance, CreateProductInput } from '../types/inventory'

export async function getProducts(filters?: {
  search?: string
  category_id?: string
  stock_status?: string
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory_balances(quantity, location_id)
    `)
    .order('name')

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((p) => {
    const balances = (p.inventory_balances as { quantity: number }[]) ?? []
    const total_stock = balances.reduce((sum, b) => sum + b.quantity, 0)
    const reorder_point = p.reorder_point ?? 0

    let stock_status: 'normal' | 'low' | 'out' = 'normal'
    if (total_stock <= 0) stock_status = 'out'
    else if (total_stock <= reorder_point) stock_status = 'low'

    if (filters?.stock_status && filters.stock_status !== 'all') {
      if (stock_status !== filters.stock_status) return null
    }

    return { ...p, total_stock, stock_status } as Product
  }).filter(Boolean) as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Product
}

export async function getProductBalances(productId: string): Promise<InventoryBalance[]> {
  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      *,
      location:locations(id, name, warehouse:warehouses(id, name, code))
    `)
    .eq('product_id', productId)
    .gt('quantity', 0)

  if (error) throw error
  return (data ?? []) as unknown as InventoryBalance[]
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Category[]
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  // Check SKU uniqueness
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('sku', input.sku)
    .single()

  if (existing) throw new Error(`SKU "${input.sku}" already exists. Please use a unique SKU.`)

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      sku: input.sku,
      category_id: input.category_id || null,
      unit_of_measure: input.unit_of_measure,
      reorder_point: input.reorder_point,
    })
    .select()
    .single()

  if (error) throw error

  // If initial stock provided
  if (input.initial_quantity && input.initial_quantity > 0 && input.initial_location_id) {
    await supabase.from('inventory_balances').upsert({
      product_id: data.id,
      location_id: input.initial_location_id,
      quantity: input.initial_quantity,
    })
  }

  return data as Product
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  if (input.sku) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', input.sku)
      .neq('id', id)
      .single()
    if (existing) throw new Error(`SKU "${input.sku}" already exists.`)
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}