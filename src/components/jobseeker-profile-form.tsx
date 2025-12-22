"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Job title is required"),
  company: z.string().min(2, "Company is required"),
  start_date: z.string().min(4, "Start date is required"),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  headline: z.string().min(5, "Headline is required"),
  summary: z.string().optional(),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  availability: z.string().min(2, "Availability is required"),
  location: z.string().min(2, "Location is required"),
  years_experience: z.number().int().min(0).max(60).optional(),
  work_permit_status: z.string().optional(),
  salary_expectation_eur: z.number().int().min(0).max(1000000).optional(),
  visibility: z.enum(["public", "employers_only", "hidden"]),
  contact_email: z.string().email("Valid contact email required"),
  phone: z.string().optional(),
  experiences: z.array(experienceSchema).optional(),
});

type ProfileRow = {
  headline?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  preferred_roles?: string[] | null;
  years_experience?: number | null;
  availability?: string | null;
  location?: string | null;
  visibility?: "public" | "employers_only" | "hidden" | null;
  work_permit_status?: string | null;
  salary_expectation_eur?: number | null;
};

type ContactRow = {
  contact_email?: string | null;
  phone?: string | null;
  cv_storage_path?: string | null;
  cv_public_url?: string | null;
};

type ExperienceRow = {
  id?: string;
  title: string;
  company: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean | null;
  location?: string | null;
  description?: string | null;
};

type Props = {
  userId: string;
  fullName: string;
  initialProfile: ProfileRow | null;
  initialContact: ContactRow | null;
  initialExperiences: ExperienceRow[];
};

export default function JobseekerProfileForm({
  userId,
  fullName,
  initialProfile,
  initialContact,
  initialExperiences,
}: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<ExperienceRow[]>(
    initialExperiences?.length ? initialExperiences : []
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        title: "",
        company: "",
        start_date: "",
        end_date: "",
        is_current: false,
        location: "",
        description: "",
      },
    ]);
  };

  const updateExperience = <K extends keyof ExperienceRow>(
    index: number,
    field: K,
    value: ExperienceRow[K]
  ) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperience = (index: number) => {
    const next = [...experiences];
    next.splice(index, 1);
    setExperiences(next);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      full_name: String(form.get("full_name") || "").trim(),
      headline: String(form.get("headline") || "").trim(),
      summary: String(form.get("summary") || "").trim(),
      availability: String(form.get("availability") || "").trim(),
      location: String(form.get("location") || "").trim(),
      years_experience: form.get("years_experience")
        ? Number(form.get("years_experience"))
        : undefined,
      work_permit_status: String(form.get("work_permit_status") || "").trim() || undefined,
      salary_expectation_eur: form.get("salary_expectation_eur")
        ? Number(form.get("salary_expectation_eur"))
        : undefined,
      visibility: form.get("visibility") as "public" | "employers_only" | "hidden",
      contact_email: String(form.get("contact_email") || "").trim(),
      phone: String(form.get("phone") || "").trim() || undefined,
      skills,
      experiences,
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      setSaving(false);
      setError(parsed.error.errors[0]?.message || "Please fix the highlighted issues.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      setError("You must be signed in.");
      return;
    }

    let cvPath = initialContact?.cv_storage_path || null;
    if (cvFile) {
      if (cvFile.type !== "application/pdf") {
        setSaving(false);
        setError("CV must be a PDF file.");
        return;
      }
      const path = `${userId}/cv-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("cv-files")
        .upload(path, cvFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: "application/pdf",
        });
      if (uploadError) {
        setSaving(false);
        setError(uploadError.message);
        return;
      }
      cvPath = path;
    }

    const profileUpsert = await supabase.from("jobseeker_profiles").upsert({
      id: userId,
      headline: payload.headline,
      summary: payload.summary,
      skills: payload.skills,
      availability: payload.availability,
      location: payload.location,
      years_experience: payload.years_experience,
      visibility: payload.visibility,
      work_permit_status: payload.work_permit_status,
      salary_expectation_eur: payload.salary_expectation_eur,
      updated_at: new Date().toISOString(),
    });
    if (profileUpsert.error) {
      setSaving(false);
      setError(profileUpsert.error.message);
      return;
    }

    const contactUpsert = await supabase.from("jobseeker_contacts").upsert({
      jobseeker_id: userId,
      contact_email: payload.contact_email,
      phone: payload.phone,
      cv_storage_path: cvPath,
      updated_at: new Date().toISOString(),
    });
    if (contactUpsert.error) {
      setSaving(false);
      setError(contactUpsert.error.message);
      return;
    }

    const profileUpdate = await supabase
      .from("profiles")
      .update({ full_name: payload.full_name, location: payload.location })
      .eq("id", userId);
    if (profileUpdate.error) {
      setSaving(false);
      setError(profileUpdate.error.message);
      return;
    }

    // Replace work experiences
    const deleteRes = await supabase.from("work_experiences").delete().eq("jobseeker_id", userId);
    if (deleteRes.error) {
      setSaving(false);
      setError(deleteRes.error.message);
      return;
    }

    if (payload.experiences && payload.experiences.length > 0) {
      const rows = payload.experiences.map((exp) => ({
        jobseeker_id: userId,
        title: exp.title,
        company: exp.company,
        start_date: exp.start_date,
        end_date: exp.is_current ? null : exp.end_date || null,
        is_current: Boolean(exp.is_current),
        location: exp.location,
        description: exp.description,
      }));
      const insertRes = await supabase.from("work_experiences").insert(rows);
      if (insertRes.error) {
        setSaving(false);
        setError(insertRes.error.message);
        return;
      }
    }

    setSaving(false);
    setMessage("Profile saved successfully.");
  };

  return (
    <div className="card p-8">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Jobseeker profile
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Publish your Malta CV for employers to discover
        </h1>
        <p className="text-sm text-slate-600">
          Structured profile first; optional PDF upload for completeness.
        </p>
      </div>
      <form className="mt-6 space-y-8" onSubmit={onSubmit}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Personal & CV basics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                name="full_name"
                defaultValue={fullName}
                required
                className="input"
              />
            </Field>
            <Field label="Location">
              <input
                name="location"
                defaultValue={initialProfile?.location || "Malta"}
                required
                className="input"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact email">
              <input
                name="contact_email"
                type="email"
                defaultValue={initialContact?.contact_email || ""}
                required
                className="input"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                name="phone"
                defaultValue={initialContact?.phone || ""}
                className="input"
              />
            </Field>
          </div>
          <Field label="Headline">
            <input
              name="headline"
              defaultValue={initialProfile?.headline || ""}
              required
              className="input"
            />
          </Field>
          <Field label="Summary">
            <textarea
              name="summary"
              rows={4}
              defaultValue={initialProfile?.summary || ""}
              className="input"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Availability">
              <input
                name="availability"
                defaultValue={initialProfile?.availability || "Immediately"}
                required
                className="input"
              />
            </Field>
            <Field label="Work permit status">
              <input
                name="work_permit_status"
                defaultValue={initialProfile?.work_permit_status || "Eligible to work in Malta"}
                className="input"
              />
            </Field>
            <Field label="Salary expectation (EUR)">
              <input
                name="salary_expectation_eur"
                type="number"
                min={0}
                defaultValue={initialProfile?.salary_expectation_eur || ""}
                className="input"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Years of experience">
              <input
                name="years_experience"
                type="number"
                min={0}
                max={60}
                defaultValue={initialProfile?.years_experience || ""}
                className="input"
              />
            </Field>
            <Field label="Visibility">
              <select
                name="visibility"
                defaultValue={initialProfile?.visibility || "public"}
                className="input"
              >
                <option value="public">Public</option>
                <option value="employers_only">Recruiters only</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Skills</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="badge cursor-pointer"
                  onClick={() => removeSkill(skill)}
                  title="Click to remove"
                >
                  {skill} ✕
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
            <button
              type="button"
              onClick={addExperience}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Add role
            </button>
          </div>
          {experiences.length === 0 ? (
            <p className="text-sm text-slate-600">No experience added yet.</p>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Job title">
                      <input
                        value={exp.title}
                        onChange={(e) => updateExperience(idx, "title", e.target.value)}
                        className="input"
                      />
                    </Field>
                    <Field label="Company">
                      <input
                        value={exp.company}
                        onChange={(e) => updateExperience(idx, "company", e.target.value)}
                        className="input"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Start date">
                      <input
                        type="date"
                        value={exp.start_date ?? ""}
                        onChange={(e) => updateExperience(idx, "start_date", e.target.value)}
                        className="input"
                      />
                    </Field>
                    <Field label="End date">
                      <input
                        type="date"
                        value={exp.end_date ?? ""}
                        onChange={(e) => updateExperience(idx, "end_date", e.target.value)}
                        disabled={exp.is_current || false}
                        className="input"
                      />
                    </Field>
                    <Field label="Current role?">
                      <input
                        type="checkbox"
                        checked={Boolean(exp.is_current)}
                        onChange={(e) => updateExperience(idx, "is_current", e.target.checked)}
                        className="h-4 w-4 accent-blue-700"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Location (optional)">
                      <input
                        value={exp.location ?? ""}
                        onChange={(e) => updateExperience(idx, "location", e.target.value)}
                        className="input"
                      />
                    </Field>
                  </div>
                  <Field label="Description">
                    <textarea
                      value={exp.description ?? ""}
                      onChange={(e) => updateExperience(idx, "description", e.target.value)}
                      rows={3}
                      className="input"
                    />
                  </Field>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">CV PDF (optional)</h2>
          <input
            name="cv_file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            className="text-sm text-slate-700"
          />
          {initialContact?.cv_storage_path ? (
            <p className="text-xs text-slate-600">
              Existing file path: {initialContact.cv_storage_path}
            </p>
          ) : (
            <p className="text-xs text-slate-600">Upload a PDF to share on unlock.</p>
          )}
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          <p className="text-xs text-slate-500">
            Visibility and contact gating follow your selection and unlock rules.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
