"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type CV = {
  id: string;
  full_name: string;
  headline: string;
  summary: string | null;
  skills: string[];
  preferred_roles: string[];
  years_experience: number | null;
  availability: string | null;
  work_permit_status: string | null;
  location: string | null;
};

type SubscriptionSummary = {
  plan_code: string;
  status: string;
  current_period_end: string | null;
};

const experienceOptions = [
  { label: "Any", value: "" },
  { label: "0-2 years", value: "0-2" },
  { label: "3-5 years", value: "3-5" },
  { label: "6-10 years", value: "6-10" },
  { label: "10+ years", value: "10+" },
];

export default function EmployerSearch() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [skills, setSkills] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [availability, setAvailability] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [workPermit, setWorkPermit] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<"limited" | "unlimited" | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUnlocks = async () => {
    const { data, error } = await supabase.from("unlocked_contacts").select("jobseeker_id");
    if (!error && data) {
      setUnlocked(new Set(data.map((d) => d.jobseeker_id)));
    }
  };

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from("employer_subscriptions")
      .select("plan_code, status, current_period_end")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const sub: SubscriptionSummary = {
        plan_code: data.plan_code,
        status: data.status,
        current_period_end: data.current_period_end ?? null,
      };
      setSubscription(sub);
    }
  };

  const search = async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from("public_cv_directory").select(
      "id, full_name, headline, summary, skills, preferred_roles, years_experience, availability, work_permit_status, location"
    );

    if (skills.trim()) {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillList.length) {
        query = query.contains("skills", skillList);
      }
    }

    if (role.trim()) {
      query = query.contains("preferred_roles", [role.trim()]);
    }

    if (availability.trim()) {
      query = query.ilike("availability", `%${availability.trim()}%`);
    }

    if (location.trim()) {
      query = query.ilike("location", `%${location.trim()}%`);
    }

    if (workPermit.trim()) {
      query = query.ilike("work_permit_status", `%${workPermit.trim()}%`);
    }

    if (experience) {
      const [min, max] = experience === "10+" ? [10, null] : experience.split("-").map(Number);
      if (min !== undefined) {
        query = query.gte("years_experience", min);
      }
      if (max !== null) {
        query = query.lte("years_experience", max as number);
      }
    }

    const { data, error } = await query.limit(50);
    if (error) {
      setError(error.message);
      setCvs([]);
    } else {
      setCvs(data || []);
    }
    setLoading(false);
  };

  const unlock = async (jobseekerId: string) => {
    setUnlocking(jobseekerId);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "unlock", jobseekerId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to unlock contact");
      setUnlocking(null);
      return;
    }
    if (json.alreadyUnlocked) {
      const next = new Set(unlocked);
      next.add(jobseekerId);
      setUnlocked(next);
      setUnlocking(null);
      return;
    }
    if (json.url) {
      window.location.href = json.url as string;
      return;
    }
    setUnlocking(null);
  };

  useEffect(() => {
    search();
    fetchUnlocks();
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSubscription = async (subscriptionType: "limited" | "unlimited") => {
    setSubscribing(subscriptionType);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "subscription", subscriptionType }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to start subscription checkout");
      setSubscribing(null);
      return;
    }
    if (json.url) {
      window.location.href = json.url as string;
    } else {
      setSubscribing(null);
    }
  };

  const trySubscriptionUnlock = async (jobseekerId: string) => {
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobseekerId }),
    });
    const json = await res.json();
    if (res.ok) {
      const next = new Set(unlocked);
      next.add(jobseekerId);
      setUnlocked(next);
      setUnlocking(null);
      return true;
    }
    if (res.status === 402) {
      // Subscription limit or missing sub; fall back to pay-per-unlock
      return false;
    }
    setError(json.error || "Failed to unlock contact");
    setUnlocking(null);
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Access options</h2>
        <p className="text-sm text-slate-600">
          Choose a subscription or pay-per-unlock. Limited plans include a fixed number of unlocks;
          unlimited provides full monthly access.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => startSubscription("limited")}
            disabled={subscribing !== null}
            className="btn btn-primary"
          >
            {subscribing === "limited" ? "Redirecting..." : "Subscribe (Limited unlocks)"}
          </button>
          <button
            onClick={() => startSubscription("unlimited")}
            disabled={subscribing !== null}
            className="btn btn-secondary"
          >
            {subscribing === "unlimited" ? "Redirecting..." : "Subscribe (Unlimited)"}
          </button>
          <p className="text-xs text-slate-600">
            You can still pay-per-unlock on each CV card if you prefer.
          </p>
        </div>
        {subscription ? (
          <p className="mt-2 text-xs text-green-700">
            Active subscription: {subscription.plan_code} ({subscription.status})
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-600">No active subscription detected.</p>
        )}
      </div>

      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-900">Search CVs</h1>
        <p className="text-sm text-slate-600">
          Search Malta-based CVs. Names and contact are blurred until unlocked.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Skills (comma separated)">
            <input
              className="input"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., React, Node, SQL"
            />
          </Field>
          <Field label="Role / function">
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Frontend Developer"
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Malta"
            />
          </Field>
          <Field label="Availability">
            <input
              className="input"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Immediately"
            />
          </Field>
          <Field label="Work permit">
            <input
              className="input"
              value={workPermit}
              onChange={(e) => setWorkPermit(e.target.value)}
              placeholder="Eligible to work in Malta"
            />
          </Field>
          <Field label="Experience">
            <select
              className="input"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              {experienceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={search}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={() => {
              setSkills("");
              setRole("");
              setExperience("");
              setAvailability("");
              setLocation("");
              setWorkPermit("");
              search();
            }}
            className="btn btn-secondary"
          >
            Clear filters
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cvs.length === 0 && !loading ? (
          <p className="text-sm text-slate-600">No CVs match these filters yet.</p>
        ) : null}
        {cvs.map((cv) => {
          const isUnlocked = unlocked.has(cv.id);
          const maskedName = maskName(cv.full_name, isUnlocked);
          const expLabel = cv.years_experience != null ? `${cv.years_experience} yrs` : "N/A";
          return (
            <div key={cv.id} className="card space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500">{maskedName}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{cv.headline}</h3>
                  {!isUnlocked ? (
                    <span className="badge bg-slate-200 text-slate-700">Locked</span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">Unlocked</span>
                  )}
                </div>
                <div className="text-right">
                  {!isUnlocked ? (
                    <button
                      onClick={async () => {
                        setUnlocking(cv.id);
                        const hasActiveSub = subscription?.status === "active";
                        if (hasActiveSub) {
                          const result = await trySubscriptionUnlock(cv.id);
                          if (result === true) return;
                          if (result === null) return;
                        }
                        await unlock(cv.id);
                      }}
                      disabled={unlocking === cv.id}
                      className="btn btn-primary text-xs"
                    >
                      {unlocking === cv.id ? "Unlocking..." : "Unlock contact"}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-green-700">Contact available</span>
                  )}
                  {!isUnlocked ? (
                    <p className="mt-1 text-[11px] text-slate-600">Paid unlock or active subscription</p>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-slate-700 line-clamp-3">{cv.summary}</p>
              <div className="flex flex-wrap gap-2">
                {cv.skills?.slice(0, 8).map((skill) => (
                  <span key={skill} className="badge">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <p>
                  <span className="font-semibold text-slate-800">Experience:</span> {expLabel}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Availability:</span>{" "}
                  {cv.availability || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Location:</span>{" "}
                  {cv.location || "Malta"}
                </p>
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Work permit:</span>{" "}
                {cv.work_permit_status || "Unknown"}
              </p>
              {!isUnlocked ? (
                <p className="text-xs text-slate-500">
                  Contact details are locked until you unlock or use your subscription.
                </p>
              ) : (
                <p className="text-xs text-green-700">
                  Contact unlocked. View details on the candidate page.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function maskName(name: string, unlocked: boolean) {
  if (unlocked) return name;
  if (!name) return "Hidden";
  const parts = name.split(" ").filter(Boolean);
  const masked = parts.map((p) => p[0] + "•••");
  return masked.join(" ");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
