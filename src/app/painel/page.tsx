import { getPublicConfig } from "@/lib/config";
import { listAutomations } from "@/lib/automations";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [config, automations] = await Promise.all([getPublicConfig(), listAutomations()]);
  return <DashboardClient initialConfig={config} initialAutomations={automations} />;
}
