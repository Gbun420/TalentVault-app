import Stripe from "stripe";
import { env, requiredEnv } from "./env";

requiredEnv("stripeSecretKey");

export const stripe = new Stripe(env.stripeSecretKey!, {
  apiVersion: "2024-06-20",
});
