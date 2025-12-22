import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JobseekerProfileForm from "@/components/jobseeker-profile-form";

export default async function JobseekerDashboard() {
  const profile = await requireRole("jobseeker", "/jobseeker");
  const supabase = await createSupabaseServerClient();

  const { data: jobseekerProfile } = await supabase
    .from("jobseeker_profiles")
    .select(
      "headline, summary, skills, preferred_roles, years_experience, availability, location, visibility, work_permit_status, salary_expectation_eur"
    )
    .eq("id", profile.id)
    .maybeSingle();

  const { data: contact } = await supabase
    .from("jobseeker_contacts")
    .select("contact_email, phone, cv_storage_path, cv_public_url")
    .eq("jobseeker_id", profile.id)
    .maybeSingle();

  const { data: experiences } = await supabase
    .from("work_experiences")
    .select("id, title, company, start_date, end_date, is_current, location, description")
    .eq("jobseeker_id", profile.id)
    .order("start_date", { ascending: false });

  return (
    <JobseekerProfileForm
      userId={profile.id}
      fullName={profile.full_name}
      initialProfile={jobseekerProfile ?? null}
      initialContact={contact ?? null}
      initialExperiences={experiences ?? []}
    />
  );
}
