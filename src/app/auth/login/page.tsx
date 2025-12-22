"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { roleHome } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirectTo") || "/";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    setError(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session?.user.id)
      .maybeSingle();

    const role = profile?.role;
    const fallback = redirectTo || (role ? roleHome[role] : "/");
    router.replace(role ? roleHome[role] : fallback);
  };

  return (
    <div className="card mx-auto max-w-md p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="text-sm text-slate-600">
          Access your Malta CV Directory account.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
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
            required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link className="text-blue-700 hover:underline" href="/auth/signup">
          Create an account
        </Link>
      </p>
    </div>
  );
}
