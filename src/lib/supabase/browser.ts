import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.warn("Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient(env.supabaseUrl || "", env.supabaseAnonKey || "");
