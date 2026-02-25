import { supabase, uploadFile, BUCKETS } from './supabase.js'

const TABLE = 'expedientes'

// ── FETCH ─────────────────────────────────────────────────────────────────────

export async function fetchExpedientes({ cedula, nombre, placa, factura } = {}) {
  let q = supabase.from(TABLE).select('*').order('created_at', { ascending: false })

  if (cedula)  q = q.ilike('cedula',  `%${cedula}%`)
  if (nombre)  q = q.ilike('nombre',  `%${nombre}%`)
  if (placa)   q = q.ilike('placa',   `%${placa}%`)
  if (factura) q = q.ilike('factura', `%${factura}%`)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchExpedienteById(id) {
  const { data, error } = await supabase
    .from(TABLE).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function fetchStats() {
  const { data, error } = await supabase.from(TABLE).select('tipo, created_at')
  if (error) throw error

  const total     = data.length
  const vehicles  = data.filter(d => d.tipo === 'vehicle').length
  const properties= data.filter(d => d.tipo === 'property').length
  const thisMonth = data.filter(d => {
    const m = new Date(d.created_at)
    const now = new Date()
    return m.getMonth() === now.getMonth() && m.getFullYear() === now.getFullYear()
  }).length

  return { total, vehicles, properties, thisMonth }
}

// ── SAVE ──────────────────────────────────────────────────────────────────────

export async function saveExpediente(payload, files = {}) {
  // Upload images that are File objects
  const urls = {}

  if (files.cedula instanceof File) {
    const path = `${Date.now()}_${files.cedula.name}`
    urls.img_cedula = await uploadFile(BUCKETS.CEDULAS, files.cedula, path)
  }
  if (files.referencia instanceof File) {
    const path = `${Date.now()}_${files.referencia.name}`
    urls.img_referencia = await uploadFile(BUCKETS.REFERENCIAS, files.referencia, path)
  }
  if (files.factura instanceof File) {
    const path = `${Date.now()}_${files.factura.name}`
    urls.img_factura = await uploadFile(BUCKETS.FACTURAS, files.factura, path)
  }

  const row = { ...payload, ...urls }

  if (row.id) {
    // UPDATE
    const { id, created_at, ...updates } = row
    const { data, error } = await supabase
      .from(TABLE).update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } else {
    // INSERT
    const { id, created_at, ...insert } = row
    const { data, error } = await supabase
      .from(TABLE).insert(insert).select().single()
    if (error) throw error
    return data
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteExpediente(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// ── BULK INSERT (used by importer) ────────────────────────────────────────────

export async function bulkInsert(rows) {
  const { data, error } = await supabase.from(TABLE).insert(rows).select()
  if (error) throw error
  return data
}
