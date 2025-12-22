import { createBrowserClient } from '@supabase/ssr'
import { env } from '../env'

export const createSupabaseClient = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)
}
