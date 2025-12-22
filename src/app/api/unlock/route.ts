import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
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
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await request.json();
    const jobseekerId = body?.jobseekerId as string | undefined;
    if (!jobseekerId) {
      return NextResponse.json({ error: "jobseekerId required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("unlocked_contacts")
      .select("id")
      .eq("employer_id", user.id)
      .eq("jobseeker_id", jobseekerId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, alreadyUnlocked: true });
    }

    // Admins can unlock freely
    if (profile.role !== "admin") {
      // Check active subscription
      const { data: subscription } = await supabase
        .from("employer_subscriptions")
        .select("plan_code, status, current_period_start, current_period_end")
        .eq("employer_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasActiveSub =
        subscription &&
        subscription.status === "active" &&
        (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

      if (!hasActiveSub) {
        return NextResponse.json(
          { error: "No active subscription. Please purchase to unlock." },
          { status: 402 }
        );
      }

      if (subscription.plan_code === "limited") {
        // Check allowed unlocks for current period
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("unlocks_included")
          .eq("plan_code", "limited")
          .maybeSingle();

        const unlockLimit = plan?.unlocks_included ?? 0;
        const start = subscription.current_period_start
          ? new Date(subscription.current_period_start)
          : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = subscription.current_period_end ? new Date(subscription.current_period_end) : new Date();
        const { count } = await supabase
          .from("unlocked_contacts")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", user.id)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());

        if (unlockLimit > 0 && count !== null && count >= unlockLimit) {
          return NextResponse.json(
            { error: "Unlock limit reached for this billing period." },
            { status: 402 }
          );
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("unlocked_contacts")
      .upsert({ employer_id: user.id, jobseeker_id: jobseekerId });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
