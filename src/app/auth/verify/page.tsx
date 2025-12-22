"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function VerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") || "";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // After successful verification, create profile
    const userId = data.user?.id;
    if (userId) {
      const full_name = search.get("full_name") || "";
      const role = (search.get("role") as any) || "jobseeker";
      
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email,
        full_name,
        role,
      });
      
      if (profileError) {
        setError(`Account verified but profile creation failed: ${profileError.message}`);
        setLoading(false);
        return;
      }
    }

    // Redirect to appropriate dashboard
    const role = search.get("role") || "jobseeker";
    const roleHome: Record<string, string> = {
      jobseeker: "/jobseeker",
      employer: "/employer",
      admin: "/admin",
    };
    
    router.replace(roleHome[role] || "/");
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Verify Email</h1>
          <p className="text-sm text-slate-600">
            Enter the 6-digit code sent to {email}
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">6-digit Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              type="text"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              className="input mt-1 text-center text-xl tracking-widest"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-slate-600">
          Wrong email?{" "}
          <Link className="text-blue-700 hover:underline" href="/auth/signup">
            Sign up again
          </Link>
        </p>
        <p className="mt-2 text-sm text-center text-slate-600">
          Already have an account?{" "}
          <Link className="text-blue-700 hover:underline" href="/auth/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
