import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminModerationBoard from "@/components/admin-moderation-board";

export default async function AdminDashboard() {
  await requireRole("admin", "/admin");
  const supabase = createSupabaseServerClient();

  const { count: cvCount } = await supabase
    .from("jobseeker_profiles")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: employerCount } = await supabase
    .from("employers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: unlockCount } = await supabase
    .from("unlocked_contacts")
    .select("id", { count: "exact", head: true });

  const { data: profiles } = await supabase
    .from("jobseeker_profiles")
    .select(
      "id, headline, visibility, moderation_status, skills, years_experience, location, updated_at, profiles(full_name)"
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin console</h1>
        <p className="text-sm text-slate-600">
          Moderate CVs, flag abuse, and view basic directory metrics.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Metric label="Total CVs" value={cvCount ?? 0} />
          <Metric label="Active employers" value={employerCount ?? 0} />
          <Metric label="CV unlocks" value={unlockCount ?? 0} />
        </div>
      </div>

      <AdminModerationBoard profiles={profiles ?? []} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
