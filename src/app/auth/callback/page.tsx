import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server"; // Using NextResponse for redirects
import { redirect } from "next/navigation";
import { AppRole, roleHome } from "@/lib/auth-constants";
import { headers } from "next/headers"; // For getting the current URL
import { env } from "@/lib/env";

export default async function AuthCallbackPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const code = searchParams.code as string;
  const next = searchParams.next as string || "/";
  const role = searchParams.role as AppRole || "jobseeker";
  const full_name = searchParams.full_name as string || "";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // After successful session, insert profile
      // Check if profile already exists to prevent duplicate inserts on refresh
      const { data: existingProfile, error: fetchProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (fetchProfileError && fetchProfileError.code !== "PGRST116") { // PGRST116 means no rows found
        console.error("Error fetching existing profile:", fetchProfileError);
        redirect("/auth/login?message=Could not create profile");
      }

      if (!existingProfile) {
        // Only insert if profile doesn't exist
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: full_name,
            role: role,
          });

        if (profileError) {
          console.error("Profile insertion error:", profileError);
          redirect("/auth/login?message=Could not create profile");
        }
      }

      // Redirect to the role-specific homepage
      if (data.user.id) {
        return redirect(roleHome[role] || next);
      }
    }
  }

  // If there's an error or no code, redirect to an error page or login
  redirect("/auth/login?message=Could not log in");
}
