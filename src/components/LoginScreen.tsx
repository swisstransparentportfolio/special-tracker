import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: (sheetId: string) => void;
}

const CORRECT_PASSWORD = "suscriptores2026";
const DEFAULT_SHEET_ID = "";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);
  const [error, setError] = useState("");

  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    // Match the ID from a full Google Sheets URL
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    // Otherwise assume it's already a raw ID
    return trimmed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== CORRECT_PASSWORD) {
      setError("Contraseña incorrecta");
      return;
    }
    if (!sheetId.trim()) {
      setError("Introduce el ID o URL de Google Sheet");
      return;
    }
    setError("");
    onLogin(extractSheetId(sheetId));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-lg border border-border bg-card p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                SwissTransparentPortfolio
              </h1>
              <p className="text-sm text-muted-foreground">Panel privado de inversiones</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-secondary border-border"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full gap-2">
              Entrar <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="border-t border-border pt-4">
              <Label htmlFor="sheetId" className="text-muted-foreground">ID de Google Sheet</Label>
              <Input
                id="sheetId"
                type="text"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                className="mt-2 bg-secondary border-border font-mono text-xs"
                placeholder="1sRkg-yB94zBcvlBuwPsR8DAOpAL-..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Compartido como "Cualquiera con el enlace puede ver"
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
