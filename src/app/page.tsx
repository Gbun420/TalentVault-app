import Link from "next/link";

export default function Home() {
  return (
    <section className="card mx-auto max-w-4xl p-10 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        TalentVault
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-4xl">
        Malta’s focused CV directory for hiring fast.
      </h1>
      <p className="mt-4 text-base text-slate-700">
        Structured profiles, clear visibility controls, and paid unlocks for verified employers.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/employer" className="btn btn-primary w-full sm:w-auto">
          I’m Hiring
        </Link>
        <Link href="/jobseeker" className="btn btn-secondary w-full sm:w-auto">
          I’m Looking for Work
        </Link>
      </div>
    </section>
  );
}
