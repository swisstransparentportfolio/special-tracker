import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import logoSp from "@/assets/logo-sp.jpg";

interface DashboardHeaderProps {
  lastUpdate: string;
  onRefresh: () => void;
  onLogout: () => void;
  loading: boolean;
}

export default function DashboardHeader({ lastUpdate, onRefresh, onLogout, loading }: DashboardHeaderProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-bold text-foreground">
            SwissTransparentPortfolio
          </h1>
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Updated {lastUpdate}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDark(!dark)}
            className="h-8 w-8 p-0"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout} className="gap-1.5">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
