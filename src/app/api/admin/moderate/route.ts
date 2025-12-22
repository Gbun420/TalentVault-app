import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Action = "flag" | "unflag" | "hide" | "unhide";

export async function POST(request: Request) {
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

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json();
  const jobseekerId = body?.jobseekerId as string | undefined;
  const action = body?.action as Action | undefined;
  if (!jobseekerId || !action) {
    return NextResponse.json({ error: "jobseekerId and action required" }, { status: 400 });
  }

  switch (action) {
    case "flag": {
      await supabaseAdmin.from("moderation_flags").insert({
        subject_type: "jobseeker_profile",
        subject_id: jobseekerId,
        raised_by: user.id,
        status: "pending",
        reason: "Flagged by admin UI",
      });
      await supabaseAdmin
        .from("jobseeker_profiles")
        .update({ moderation_status: "pending" })
        .eq("id", jobseekerId);
      return NextResponse.json({ moderation_status: "pending" });
    }
    case "unflag": {
      await supabaseAdmin
        .from("moderation_flags")
        .update({ status: "approved", resolved_at: new Date().toISOString() })
        .eq("subject_id", jobseekerId)
        .eq("subject_type", "jobseeker_profile");
      await supabaseAdmin
        .from("jobseeker_profiles")
        .update({ moderation_status: "approved" })
        .eq("id", jobseekerId);
      return NextResponse.json({ moderation_status: "approved" });
    }
    case "hide": {
      await supabaseAdmin
        .from("jobseeker_profiles")
        .update({ visibility: "hidden", moderation_status: "suspended" })
        .eq("id", jobseekerId);
      await supabaseAdmin
        .from("moderation_flags")
        .insert({
          subject_type: "jobseeker_profile",
          subject_id: jobseekerId,
          raised_by: user.id,
          status: "suspended",
          reason: "Hidden/suspended by admin",
        });
      return NextResponse.json({ moderation_status: "suspended", visibility: "hidden" });
    }
    case "unhide": {
      await supabaseAdmin
        .from("jobseeker_profiles")
        .update({ visibility: "public", moderation_status: "approved" })
        .eq("id", jobseekerId);
      await supabaseAdmin
        .from("moderation_flags")
        .update({ status: "approved", resolved_at: new Date().toISOString() })
        .eq("subject_id", jobseekerId)
        .eq("subject_type", "jobseeker_profile");
      return NextResponse.json({ moderation_status: "approved", visibility: "public" });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
