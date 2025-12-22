"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { roleHome, AppRole } from "@/lib/auth-constants";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirectTo") || "/";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usePasswordless, setUsePasswordless] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    setError(null);
    setLoading(true);

    if (usePasswordless) {
      // Send OTP code
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }

      setShowOtpInput(true);
      setLoading(false);
      return;
    }

    // Regular password login
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

    const role = profile?.role as AppRole | undefined;
    const fallback = redirectTo || (role ? roleHome[role] : "/");
    router.replace(role ? roleHome[role] : fallback);
  };

  const onOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const code = String(formData.get("otp") || "").trim();
    
    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session?.user.id)
      .maybeSingle();

    const role = profile?.role as AppRole | undefined;
    const fallback = redirectTo || (role ? roleHome[role] : "/");
    router.replace(role ? roleHome[role] : fallback);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
          <p className="text-sm text-slate-600">
            Access your TalentVault account.
          </p>
        </div>
        <form className="space-y-4" onSubmit={showOtpInput ? onOtpSubmit : onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="input mt-1"
            />
          </div>
          {!usePasswordless && !showOtpInput && (
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                name="password"
                type="password"
                required
                className="input mt-1"
              />
            </div>
          )}
          {showOtpInput && (
            <div>
              <label className="text-sm font-medium text-slate-700">6-digit Code</label>
              <input
                name="otp"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                required
                className="input mt-1 text-center text-xl tracking-widest"
              />
            </div>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (showOtpInput ? "Verifying..." : usePasswordless ? "Sending code..." : "Signing in...") : (showOtpInput ? "Verify Code" : usePasswordless ? "Send Code" : "Login")}
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {!showOtpInput && (
            <button
              type="button"
              onClick={() => setUsePasswordless(!usePasswordless)}
              className="text-sm text-blue-700 hover:underline w-full text-center"
            >
              {usePasswordless ? "Use password instead" : "Use 6-digit code instead"}
            </button>
          )}
          {showOtpInput && (
            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="text-sm text-blue-700 hover:underline w-full text-center"
            >
              Back to login options
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-center text-slate-600">
          New here?{" "}
          <Link className="text-blue-700 hover:underline" href="/auth/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
