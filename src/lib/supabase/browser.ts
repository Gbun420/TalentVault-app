import { createBrowserClient } from "@supabase/ssr";
import { env, requiredEnv } from "../env";

requiredEnv("supabaseUrl", "supabaseAnonKey");

export const createSupabaseBrowserClient = () =>
  createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
