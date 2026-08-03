import Dashboard from "@/components/Dashboard";
import { getSolanaReport } from "@/lib/report/build-report";

export const dynamic = "force-dynamic";

export default async function Home() {
  const report = await getSolanaReport();
  return <Dashboard initialReport={report} />;
}
