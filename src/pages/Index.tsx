import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

const SESSION_KEY = "sp_session";

export default function Index() {
  const [sheetId, setSheetId] = useState<string | null>(
    () => localStorage.getItem(SESSION_KEY)
  );

  const handleLogin = (id: string) => {
    localStorage.setItem(SESSION_KEY, id);
    setSheetId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSheetId(null);
  };

  if (!sheetId) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard sheetId={sheetId} onLogout={handleLogout} />;
}
