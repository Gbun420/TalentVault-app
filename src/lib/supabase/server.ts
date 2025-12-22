import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "../env";

export const createSupabaseServerClient = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies,
  });
};
