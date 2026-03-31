import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseUrl = envSupabaseUrl || (projectId ? `https://${projectId}.supabase.co` : '')
export const supabaseAnonKey = envSupabaseAnonKey || publicAnonKey || ''
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel for production deployments.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
