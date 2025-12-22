import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14 lg:py-18">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">TalentVault</p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 lg:text-5xl">
              Stop posting jobs. Start hiring.
            </h1>
            <p className="text-lg text-slate-700">
              Search real CVs from Malta-based candidates and contact them instantly — without job ads or recruiter fees.
            </p>
            <p className="text-sm text-slate-600">
              Pay only when you unlock a candidate. No subscriptions required.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/employer" className="btn btn-primary w-full sm:w-auto text-base">
              Browse CVs (Employers)
            </Link>
            <Link href="/jobseeker" className="btn btn-secondary w-full sm:w-auto text-base">
              Post Your CV (Jobseekers)
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl space-y-4 px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Why job ads and recruiters no longer work</h2>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-700">•</span>
              <p>Job ads cost €150–€400 and rely on applications.</p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700">•</span>
              <p>Recruiters charge 15–25% of salary.</p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700">•</span>
              <p>Hiring takes weeks, not days.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl gap-4 px-6 sm:grid-cols-3">
          <ValueCard title="Search CVs instantly" body="Browse verified Malta-based profiles without posting a job." />
          <ValueCard title="Unlock only when ready" body="See contact details only when you choose to unlock." />
          <ValueCard title="Malta-only, GDPR-ready" body="Local talent, compliant storage, and visibility controls." />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-slate-50 px-6 py-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Why TalentVault is faster and cheaper</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">Traditional hiring:</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>• Pay upfront</li>
                <li>• Wait for applicants</li>
                <li>• No guarantee</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">TalentVault:</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-800">
                <li>• €0 to browse</li>
                <li>• Contact in minutes</li>
                <li>• Pay only if you unlock</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-2">
          <h4 className="text-base font-semibold text-slate-900">Trust and safety</h4>
          <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 md:grid-cols-4">
            <li>Malta-only platform — built for local hiring.</li>
            <li>GDPR-compliant — sensitive data stored securely.</li>
            <li>No AI decision-making — humans stay in control.</li>
            <li>Full visibility control — jobseekers choose who sees contact info.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Hiring in Malta shouldn’t take weeks.</h2>
          <Link href="/employer" className="btn btn-primary text-base">
            Employer Access
          </Link>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
