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

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim()
  // Check if category already exists
  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle()

  if (existing) return existing as Category

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: trimmed })
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  // Check if category has products
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
  if ((count ?? 0) > 0) {
    throw new Error('Cannot delete a category that has products assigned to it. Reassign or delete the products first.')
  }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const cleanSku = input.sku.trim().toUpperCase()
  const cleanName = input.name.trim()

  // Check SKU uniqueness using maybeSingle (does not throw when 0 rows found)
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('sku', cleanSku)
    .maybeSingle()

  if (existing) throw new Error(`SKU "${cleanSku}" already exists. Please use a unique SKU.`)

  const payload: Record<string, any> = {
    name: cleanName,
    sku: cleanSku,
    category_id: input.category_id || null,
    unit_of_measure: input.unit_of_measure.trim(),
    unit: input.unit_of_measure.trim(),
    reorder_point: Number(input.reorder_point) || 0,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  // If initial stock provided — create a proper inventory balance AND a stock movement ledger entry
  if (input.initial_quantity && Number(input.initial_quantity) > 0 && input.initial_location_id) {
    const qty = Number(input.initial_quantity)
    try {
      // Set the balance
      const { error: balError } = await supabase
        .from('inventory_balances')
        .upsert({
          product_id: data.id,
          location_id: input.initial_location_id,
          quantity: qty,
          updated_at: new Date().toISOString(),
        })
      if (balError) console.warn('[productsService] Inventory balance notice:', balError.message)

      // Record the stock movement so ledger is complete
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.id,
          location_id: input.initial_location_id,
          quantity_delta: qty,
          movement_type: 'receipt',
          reason: 'Initial stock on product creation',
        })
      if (movError) console.warn('[productsService] Ledger movement notice:', movError.message)
    } catch (stockErr: any) {
      console.warn('[productsService] Initial stock warning:', stockErr?.message || stockErr)
    }
  }

  return data as Product
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  if (input.sku) {
    const cleanSku = input.sku.trim().toUpperCase()
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', cleanSku)
      .neq('id', id)
      .maybeSingle()
    if (existing) throw new Error(`SKU "${cleanSku}" already exists.`)
  }

  // Strip initial stock fields — stock only changes via operations
  const { initial_quantity: _iq, initial_location_id: _il, ...updateFields } = input

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updateFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}