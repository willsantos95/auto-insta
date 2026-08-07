import { getPublicConfig, listInstagramAccounts } from "@/lib/config";
import { listAutomations } from "@/lib/automations";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [config, automations, accounts] = await Promise.all([
    getPublicConfig(),
    listAutomations(),
    listInstagramAccounts(),
  ]);
  return (
    <DashboardClient
      initialConfig={config}
      initialAutomations={automations}
      initialAccounts={accounts}
    />
  );
}
