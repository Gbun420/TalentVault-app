import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "../env";

export const createSupabaseServerClient = async () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value))
      },
    },
  });
};
