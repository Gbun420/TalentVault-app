import Link from "next/link";

const features = [
  {
    title: "Malta-only CV directory",
    body: "Structured CVs with visibility controls (public, employers-only, hidden).",
  },
  {
    title: "Employer unlocks",
    body: "Pay-per-unlock or subscriptions; track who viewed contacts.",
  },
  {
    title: "Jobseeker boosts",
    body: "Boost your profile for extra visibility while staying GDPR-safe.",
  },
];

export default function Home() {
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="card p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          TalentVault
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          A GDPR-ready CV directory for Malta employers and jobseekers.
        </h1>
        <p className="mt-4 text-slate-700">
          Employers pay to unlock contact details. Jobseekers control visibility and can boost
          their profiles. Built on Supabase Auth, Stripe, and Next.js for production readiness.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/employer"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800"
          >
            I’m hiring
          </Link>
          <Link
            href="/jobseeker"
            className="rounded-md border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50"
          >
            I’m a jobseeker
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-blue-700"
          >
            Login
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-700">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-8">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            <Link className="text-blue-700 hover:underline" href="/auth/signup">
              Sign up (jobseeker or employer)
            </Link>
          </li>
          <li>
            <Link className="text-blue-700 hover:underline" href="/employer">
              Browse CV directory (requires employer login)
            </Link>
          </li>
          <li>
            <Link className="text-blue-700 hover:underline" href="/jobseeker">
              Publish or boost your CV (requires login)
            </Link>
          </li>
        </ul>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">GDPR posture</p>
          <p className="mt-2">
            Soft deletes on PII tables, contact details gated behind explicit unlocks, and admin
            moderation controls are built into the schema and middleware.
          </p>
        </div>
      </div>
    </div>
  );
}
