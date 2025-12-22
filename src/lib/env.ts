import { z } from "zod";

const envSchema = z.object({
  // Public (client-side) variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Server-side variables
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_UNLOCK_PRICE_ID: z.string().optional(),
  STRIPE_SUB_LIMITED_PRICE_ID: z.string().optional(),
  STRIPE_SUB_UNLIMITED_PRICE_ID: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_UNLOCK_PRICE_ID: process.env.STRIPE_UNLOCK_PRICE_ID,
  STRIPE_SUB_LIMITED_PRICE_ID: process.env.STRIPE_SUB_LIMITED_PRICE_ID,
  STRIPE_SUB_UNLIMITED_PRICE_ID: process.env.STRIPE_SUB_UNLIMITED_PRICE_ID,
});

export function requiredEnv(...keys: string[]) {
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}