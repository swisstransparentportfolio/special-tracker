import { useState, useCallback, useEffect } from "react";
import { fetchSheet, SheetData } from "@/lib/googleSheets";
import { fetchBenchmarks } from "@/lib/benchmarks";
import DashboardHeader from "./DashboardHeader";
import RentabilidadTab from "./tabs/RentabilidadTab";
import PortfolioTab from "./tabs/PortfolioTab";
import EstudiadosTab from "./tabs/EstudiadosTab";
import SwissWatchlistTab from "./tabs/SwissWatchlistTab";
import EnDesarrolloTab from "./tabs/EnDesarrolloTab";
import SpecialSituationsTab from "./tabs/SpecialSituationsTab";
import MarketTicker from "./MarketTicker";

interface Props {
  sheetId: string;
  onLogout: () => void;
}

const TABS = [
  { key: "rentabilidad", label: "Performance" },
  { key: "portfolio", label: "Portfolio" },
  { key: "special", label: "Special Situations" },
  { key: "estudiados", label: "Watchlist" },
  { key: "swissWatchlist", label: "Swiss Watchlist" },
  { key: "desarrollo", label: "Pipeline" },
] as const;

type TabKey = typeof TABS[number]["key"];

type AllTabs = TabKey | "movements";

const SHEET_NAMES: Record<AllTabs, string[]> = {
  rentabilidad: ["Performance", "Rentabilidad", "rentabilidad", "Returns"],
  portfolio: ["Portfolio", "portfolio", "10Bagger", "Cartera", "Posiciones"],
  special: ["Special Situations", "Special", "Situaciones Especiales"],
  estudiados: ["Watchlist", "Estudiados", "estudiados", "Estudiadas"],
  swissWatchlist: ["Swiss Watchlist", "Swiss"],
  desarrollo: ["Pipeline", "En desarrollo", "Desarrollo", "En Desarrollo"],
  movements: ["Movements", "Movimientos", "Latest Movements"],
};

// Expected header keywords per tab to validate we got the right sheet
const HEADER_VALIDATORS: Record<AllTabs, string[]> = {
  rentabilidad: ["period", "portfolio"],
  portfolio: ["ticker", "weight", "peso", "company", "empresa"],
  special: ["name", "type", "tender", "expiration", "profit"],
  estudiados: ["ticker", "sector", "company", "empresa"],
  swissWatchlist: ["ticker", "sector", "company", "empresa"],
  desarrollo: ["status", "priority", "type", "tipo"],
  movements: ["type", "company", "ticker", "date", "price"],
};

export default function Dashboard({ sheetId, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("rentabilidad");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [data, setData] = useState<Record<TabKey, SheetData | null>>({
    rentabilidad: null,
    portfolio: null,
    special: null,
    estudiados: null,
    swissWatchlist: null,
    desarrollo: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    setLastUpdate(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

    // Load sheet data first (fast), then benchmarks in background
    const sheetResults = await Promise.all(
      (Object.keys(SHEET_NAMES) as TabKey[]).map(async (tab) => {
        for (const name of SHEET_NAMES[tab]) {
          try {
            const sheet = await fetchSheet(sheetId, name);
            if (sheet.rows.length === 0) continue;
            const validators = HEADER_VALIDATORS[tab];
            const headersLower = sheet.headers.map(h => h.toLowerCase());
            const matches = validators.some(v => headersLower.some(h => h.includes(v)));
            if (matches) {
              sheet.rows = sheet.rows.filter(r => !r[0]?.startsWith("NOTE"));
              return { tab, sheet };
            }
          } catch { /* Try next */ }
        }
        return { tab, sheet: null };
      })
    );

    const results: Record<string, SheetData | null> = {};
    sheetResults.forEach(({ tab, sheet }) => { results[tab] = sheet; });
    setData(results as Record<TabKey, SheetData | null>);
    setLoading(false);

    // Fetch benchmarks in background (doesn't block UI)
    fetchBenchmarks().then(b => setBenchmarks(b)).catch(() => {});
    setLoading(false);
  }, [sheetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-background">
      <MarketTicker />
      <DashboardHeader
        lastUpdate={lastUpdate}
        onRefresh={loadData}
        onLogout={onLogout}
        loading={loading}
      />

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="container flex gap-0 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
          <RentabilidadTab rentabilidadData={data.rentabilidad} loading={loading} benchmarks={benchmarks} />
        )}
        {activeTab === "portfolio" && (
          <PortfolioTab portfolioData={data.portfolio} loading={loading} />
        )}
        {activeTab === "special" && (
          <SpecialSituationsTab data={data.special} loading={loading} />
        )}
        {activeTab === "estudiados" && (
          <EstudiadosTab data={data.estudiados} loading={loading} />
        )}
        {activeTab === "swissWatchlist" && (
          <SwissWatchlistTab data={data.swissWatchlist} loading={loading} />
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
