import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import logoSp from "@/assets/logo-sp.jpg";
import MarketTicker from "./MarketTicker";

interface LoginScreenProps {
  onLogin: (sheetId: string) => void;
}

const CORRECT_PASSWORD = "STP2026";
const DEFAULT_SHEET_ID = "1i6k_807-JF8YIUEROyAl7edr7RFWwALy";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== CORRECT_PASSWORD) {
      setError("Incorrect password");
      return;
    }
    setError("");
    onLogin(DEFAULT_SHEET_ID);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketTicker />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-lg border border-border bg-card p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <img src={logoSp} alt="Swiss Portfolio" className="h-12 w-12 rounded-lg object-cover shadow-md" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">
                  Swiss Portfolio
                </h1>
                <p className="text-sm text-muted-foreground">Private Investment Dashboard</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-secondary border-border pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2">
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
