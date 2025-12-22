import { requireRole } from "@/lib/auth";
import EmployerSearch from "@/components/employer-search";

export default async function EmployerSearchPage() {
  await requireRole(["employer", "admin"], "/employer/search");
  return <EmployerSearch />;
}
