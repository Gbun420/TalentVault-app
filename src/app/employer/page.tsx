import { requireRole } from "@/lib/auth";

export default async function EmployerDashboard() {
  const profile = await requireRole(["employer", "admin"], "/employer");

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Employer dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">
        Welcome, {profile.full_name}. Browse and unlock Malta-based CVs.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-slate-700">
        <li>• Search CV directory (public and employers-only visibility).</li>
        <li>• Unlock contact details after payment or subscription allowance.</li>
        <li>• Manage invoices and subscription status.</li>
      </ul>
      <div className="mt-6">
        <a
          href="/employer/search"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800"
        >
          Go to CV search
        </a>
      </div>
    </div>
  );
}
