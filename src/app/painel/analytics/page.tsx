import { Metadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics - Instagram Auto",
  description: "Análise de execuções e gatilhos das automações",
};

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
