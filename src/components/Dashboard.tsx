import { useState, useCallback, useEffect } from "react";
import { fetchSheet, SheetData } from "@/lib/googleSheets";
import { fetchBenchmarks } from "@/lib/benchmarks";
import DashboardHeader from "./DashboardHeader";
import RentabilidadTab from "./tabs/RentabilidadTab";
import PortfolioTab from "./tabs/PortfolioTab";
import EstudiadosTab from "./tabs/EstudiadosTab";
import EnDesarrolloTab from "./tabs/EnDesarrolloTab";

interface Props {
  sheetId: string;
  onLogout: () => void;
}

const TABS = [
  { key: "rentabilidad", label: "Performance" },
  { key: "portfolio", label: "Portfolio" },
  { key: "estudiados", label: "Watchlist" },
  { key: "desarrollo", label: "Pipeline" },
] as const;

type TabKey = typeof TABS[number]["key"];

const SHEET_NAMES: Record<TabKey, string[]> = {
  rentabilidad: ["Rentabilidad", "rentabilidad", "Returns", "Performance"],
  portfolio: ["Portfolio", "portfolio", "10Bagger", "Cartera", "Posiciones"],
  estudiados: ["Estudiados", "estudiados", "Watchlist", "Estudiadas"],
  desarrollo: ["En desarrollo", "Desarrollo", "Pipeline", "En Desarrollo"],
};

export default function Dashboard({ sheetId, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("rentabilidad");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [data, setData] = useState<Record<TabKey, SheetData | null>>({
    rentabilidad: null,
    portfolio: null,
    estudiados: null,
    desarrollo: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    setLastUpdate(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

    const results: Record<string, SheetData | null> = {};

    const [sheetResults, benchmarkData] = await Promise.all([
      Promise.all(
        (Object.keys(SHEET_NAMES) as TabKey[]).map(async (tab) => {
          for (const name of SHEET_NAMES[tab]) {
            try {
              const sheet = await fetchSheet(sheetId, name);
              if (sheet.rows.length > 0) return { tab, sheet };
            } catch { /* Try next */ }
          }
          return { tab, sheet: null };
        })
      ),
      fetchBenchmarks(),
    ]);

    const results: Record<string, SheetData | null> = {};
    sheetResults.forEach(({ tab, sheet }) => { results[tab] = sheet; });
      (Object.keys(SHEET_NAMES) as TabKey[]).map(async (tab) => {
        for (const name of SHEET_NAMES[tab]) {
          try {
            const sheet = await fetchSheet(sheetId, name);
            if (sheet.rows.length > 0) {
              results[tab] = sheet;
              return;
            }
          } catch {
            // Try next name
          }
        }
        results[tab] = null;
      })
    );

    setData(results as Record<TabKey, SheetData | null>);
    setLoading(false);
  }, [sheetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        lastUpdate={lastUpdate}
        onRefresh={loadData}
        onLogout={onLogout}
        loading={loading}
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="container py-6">
        {activeTab === "rentabilidad" && (
          <RentabilidadTab rentabilidadData={data.rentabilidad} loading={loading} />
        )}
        {activeTab === "portfolio" && (
          <PortfolioTab portfolioData={data.portfolio} loading={loading} />
        )}
        {activeTab === "estudiados" && (
          <EstudiadosTab data={data.estudiados} loading={loading} />
        )}
        {activeTab === "desarrollo" && (
          <EnDesarrolloTab data={data.desarrollo} loading={loading} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3 text-right">
        <div className="container">
          <span className="text-xs text-muted-foreground">Real-time data · {lastUpdate}</span>
        </div>
      </footer>
    </div>
  );
}
