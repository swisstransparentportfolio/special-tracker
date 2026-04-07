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
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
        <a href="https://swisstransparentportfolio.substack.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <img src={logoSp} alt="Swiss Portfolio" className="h-9 w-9 rounded-md object-cover" />
          <h1 className="font-display text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
            Swiss Portfolio
          </h1>
        </a>
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground flex-shrink-0">
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
            className="gap-1 sm:gap-1.5 px-2 sm:px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout} className="gap-1 sm:gap-1.5 px-2 sm:px-3">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
