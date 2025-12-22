"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { roleHome, AppRole } from "@/lib/auth-constants";

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

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email,
        full_name,
        role,
      });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
      router.replace(roleHome[role]);
    } else {
      setError("Signup succeeded, please confirm your email to continue.");
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="text-sm text-slate-600">
          Choose whether you are hiring or publishing your CV.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            name="full_name"
            required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            name="password"
            type="password"
            minLength={6}
            required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Account type</label>
          <select
            name="role"
            defaultValue="jobseeker"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="jobseeker">Jobseeker</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="text-blue-700 hover:underline" href="/auth/login">
          Login
        </Link>
      </p>
    </div>
  );
}
