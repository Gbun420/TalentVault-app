import { createClient } from "@supabase/supabase-js";
import { env, requiredEnv } from "../env";

requiredEnv("supabaseUrl", "supabaseServiceRole");

export const supabaseAdmin = createClient(env.supabaseUrl!, env.supabaseServiceRole!);
