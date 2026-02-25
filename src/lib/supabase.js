import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket names
export const BUCKETS = {
  CEDULAS: 'cedulas',
  REFERENCIAS: 'referencias',
  FACTURAS: 'facturas',
}

/**
 * Upload a file to a Supabase storage bucket.
 * Returns the public URL or throws.
 */
export async function uploadFile(bucket, file, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a file from a bucket by its public URL.
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) console.warn('Could not delete file:', error.message)
}
