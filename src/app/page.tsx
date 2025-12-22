import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 lg:flex-row lg:items-center lg:py-20">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">TalentVault</p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 lg:text-5xl">
              Hire directly from verified CVs in Malta.
            </h1>
            <p className="text-lg text-slate-700">
              No job ads. No recruiters. Search real CVs and unlock candidates only when you’re ready to contact them.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/employer" className="btn btn-primary w-full sm:w-auto">
                Browse CVs
              </Link>
              <Link href="/jobseeker" className="btn btn-secondary w-full sm:w-auto">
                Post Your CV
              </Link>
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-6 text-left shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Why TalentVault</h3>
            <ul className="mt-4 space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="text-blue-700">•</span>
                <div>
                  <p className="font-semibold text-slate-900">Direct search</p>
                  <p className="text-sm text-slate-600">Find Malta-based talent without posting jobs.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-700">•</span>
                <div>
                  <p className="font-semibold text-slate-900">Unlock when ready</p>
                  <p className="text-sm text-slate-600">Pay per unlock or use a subscription for volume hiring.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-700">•</span>
                <div>
                  <p className="font-semibold text-slate-900">Built for Malta</p>
                  <p className="text-sm text-slate-600">Local compliance, GDPR-safe storage, and visibility controls.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-2 sm:grid-cols-3">
          <ValueCard title="Direct Access" body="Search CVs instantly. No waiting for applications." />
          <ValueCard title="Pay Per Result" body="Only pay when you unlock a candidate." />
          <ValueCard title="Malta Only" body="Local talent, local hiring rules." />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-center text-sm font-semibold text-slate-700">
            Built for Maltese employers. GDPR-ready. No AI decision-making. Full visibility control.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Stop posting jobs. Start hiring.</h2>
          <Link href="/employer" className="btn btn-primary">
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
