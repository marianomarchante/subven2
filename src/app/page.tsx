import { getDashboardData } from "@/actions/subvenciones";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getDashboardData();

  return <DashboardClient initialData={initialData} />;
}
