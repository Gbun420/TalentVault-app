import Stripe from "stripe";
import { env } from "@/lib/env";

// Lazy initialization of Stripe to prevent build failures if env var is not available at build time
let stripe: Stripe | undefined;

export const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover", // Updated API version
      typescript: true, // Enable TypeScript support
    });
  }
  return stripe;
};
