"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AppRole } from "@/lib/auth-constants";
import { env } from "@/lib/env"; // Import the env object

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const role = (formData.get("role") as AppRole) || "jobseeker";
    setError(null);
    setLoading(true);

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${encodeURIComponent(role)}&full_name=${encodeURIComponent(full_name)}`, // Use SITE_URL and pass role and full_name
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // After signup, redirect to a generic message page, or back to login with a message
    router.push("/auth/verify-email-message"); // A new page to inform user to check email
    return;
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-600">
            Choose whether you are hiring or publishing your Profile.
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              name="full_name"
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Account type</label>
            <select
              name="role"
              defaultValue="jobseeker"
              className="input mt-1"
            >
              <option value="jobseeker">Jobseeker</option>
              <option value="employer">Employer</option>
            </select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-600">
          Already have an account?{" "}
          <Link className="text-blue-700 hover:underline" href="/auth/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
