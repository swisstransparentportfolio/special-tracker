import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

export default function Index() {
  const [sheetId, setSheetId] = useState<string | null>(null);

  if (!sheetId) {
    return <LoginScreen onLogin={setSheetId} />;
  }

  return <Dashboard sheetId={sheetId} onLogout={() => setSheetId(null)} />;
}
