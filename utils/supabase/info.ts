// Supabase Project Configuration
// This file contains fallback configuration for development
// In production, these should be set via environment variables

export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || ''
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Fallback demo configuration (for development only)
export const demoConfig = {
  url: 'https://demo.supabase.co',
  anonKey: 'demo-key'
}

// Validate configuration
export const validateSupabaseConfig = () => {
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('Missing Supabase environment variables:', missingVars)
    console.warn('Please set these in your deployment environment or .env file')
    return false
  }
  
  return true
}
