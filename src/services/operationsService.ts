import { supabase } from '../lib/supabase'
import type { InventoryDocument, DocumentType, DocumentStatus, CreateDocumentInput } from '../types/inventory'

const DOCUMENT_SELECT = `
  *,
  source_location:locations!inventory_documents_source_location_id_fkey(
    id, name, warehouse:warehouses(id, name, code)
  ),
  destination_location:locations!inventory_documents_destination_location_id_fkey(
    id, name, warehouse:warehouses(id, name, code)
  ),
  lines:inventory_document_lines(
    *,
    product:products(id, name, sku, unit_of_measure)
  )
`

function generateRef(type: DocumentType): string {
  const prefixes: Record<DocumentType, string> = {
    receipt: 'RC',
    delivery: 'DO',
    transfer: 'TR',
    adjustment: 'ADJ',
  }
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefixes[type]}-${num}`
}

export async function getDocuments(filters?: {
  type?: DocumentType | 'all'
  status?: DocumentStatus | 'all'
  search?: string
  location_id?: string
}): Promise<InventoryDocument[]> {
  let query = supabase
    .from('inventory_documents')
    .select(DOCUMENT_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.type && filters.type !== 'all') query = query.eq('type', filters.type)
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(`reference_no.ilike.%${filters.search}%,partner_name.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as InventoryDocument[]
}

export async function getDocumentById(id: string): Promise<InventoryDocument | null> {
  const { data, error } = await supabase
    .from('inventory_documents')
    .select(DOCUMENT_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as InventoryDocument
}

export async function createDocument(input: CreateDocumentInput, userId?: string): Promise<InventoryDocument> {
  const ref = generateRef(input.type)

  const { data: doc, error: docError } = await supabase
    .from('inventory_documents')
    .insert({
      reference_no: ref,
      type: input.type,
      status: 'draft',
      partner_name: input.partner_name || null,
      source_location_id: input.source_location_id || null,
      destination_location_id: input.destination_location_id || null,
      notes: input.notes || null,
      created_by: userId || null,
    })
    .select()
    .single()

  if (docError) throw docError

  const lines = input.lines.map((l) => ({
    document_id: doc.id,
    product_id: l.product_id,
    quantity: l.quantity,
    counted_quantity: l.counted_quantity ?? null,
    reason: l.reason ?? null,
  }))

  const { error: lineError } = await supabase.from('inventory_document_lines').insert(lines)
  if (lineError) throw lineError

  const full = await getDocumentById(doc.id)
  return full!
}

export async function updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
  const { error } = await supabase
    .from('inventory_documents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function validateReceipt(documentId: string): Promise<void> {
  const { error } = await supabase.rpc('validate_receipt', { p_document_id: documentId })
  if (error) throw new Error(error.message)
}

export async function validateDelivery(documentId: string): Promise<void> {
  const { error } = await supabase.rpc('validate_delivery', { p_document_id: documentId })
  if (error) throw new Error(error.message)
}

export async function validateTransfer(documentId: string): Promise<void> {
  const { error } = await supabase.rpc('validate_transfer', { p_document_id: documentId })
  if (error) throw new Error(error.message)
}

export async function validateAdjustment(documentId: string): Promise<void> {
  const { error } = await supabase.rpc('validate_adjustment', { p_document_id: documentId })
  if (error) throw new Error(error.message)
}

export async function getStockAtLocation(productId: string, locationId: string): Promise<number> {
  const { data } = await supabase
    .from('inventory_balances')
    .select('quantity')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .single()
  return data?.quantity ?? 0
}
