import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env, requiredEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body =
  | { mode: "unlock"; jobseekerId: string }
  | { mode: "subscription"; subscriptionType: "limited" | "unlimited" };

requiredEnv("stripeSecretKey");

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!profile || (profile.role !== "employer" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Only employers can pay" }, { status: 403 });
    }

    const body = (await request.json()) as Body;

    if (body.mode === "unlock") {
      if (!env.stripeUnlockPriceId) {
        return NextResponse.json({ error: "Unlock price not configured" }, { status: 500 });
      }
      if (!body.jobseekerId) {
        return NextResponse.json({ error: "jobseekerId required" }, { status: 400 });
      }

      // Prevent double checkout if already unlocked
      const { data: existing } = await supabase
        .from("unlocked_contacts")
        .select("id")
        .eq("employer_id", user.id)
        .eq("jobseeker_id", body.jobseekerId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ alreadyUnlocked: true });
      }

      const price = await stripe.prices.retrieve(env.stripeUnlockPriceId);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? undefined,
        line_items: [{ price: env.stripeUnlockPriceId, quantity: 1 }],
        success_url: `${env.siteUrl}/employer/search?status=success`,
        cancel_url: `${env.siteUrl}/employer/search?status=cancelled`,
        metadata: {
          payment_type: "unlock",
          employer_id: user.id,
          jobseeker_id: body.jobseekerId,
        },
      });

      await supabaseAdmin.from("payments").insert({
        user_id: user.id,
        jobseeker_id: body.jobseekerId,
        amount_cents: price.unit_amount ?? 0,
        currency: price.currency ?? "eur",
        payment_type: "unlock",
        status: "pending",
        stripe_checkout_session_id: session.id,
        metadata: { mode: "unlock" },
      });

      return NextResponse.json({ url: session.url });
    }

    if (body.mode === "subscription") {
      const priceId =
        body.subscriptionType === "limited"
          ? env.stripeSubLimitedPriceId
          : env.stripeSubUnlimitedPriceId;

      if (!priceId) {
        return NextResponse.json({ error: "Subscription price not configured" }, { status: 500 });
      }

      const planCode = body.subscriptionType === "limited" ? "limited" : "unlimited";
      const price = await stripe.prices.retrieve(priceId);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.siteUrl}/employer/search?status=success`,
        cancel_url: `${env.siteUrl}/employer/search?status=cancelled`,
        metadata: {
          payment_type: "subscription",
          employer_id: user.id,
          plan_code: planCode,
        },
        subscription_data: {
          metadata: {
            employer_id: user.id,
            plan_code: planCode,
          },
        },
      });

      await supabaseAdmin.from("payments").insert({
        user_id: user.id,
        jobseeker_id: null,
        amount_cents: price.unit_amount ?? 0,
        currency: price.currency ?? "eur",
        payment_type: "subscription",
        status: "pending",
        stripe_checkout_session_id: session.id,
        metadata: { plan_code: planCode },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
