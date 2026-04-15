/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_PROJECT_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string
  readonly VITE_ENABLE_CSP: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_DEV_MODE: string
  readonly VITE_DEBUG_MODE: string
  readonly more: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
