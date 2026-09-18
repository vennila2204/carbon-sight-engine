import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Role, User } from "@/lib/types";

export const DEMO_ACCOUNTS: (User & { password: string })[] = [
  {
    id: "u1",
    name: "Vennila M",
    email: "user@carbonengine.io",
    password: "user123",
    role: "USER",
    facility: "Coimbatore Plant 1",
  },
  {
    id: "u2",
    name: "System Administrator",
    email: "admin@carbonengine.io",
    password: "admin123",
    role: "ADMIN",
    facility: "All Facilities",
  },
];

const STORAGE_KEY = "cire.auth.user";

interface AuthValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const found = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
      );
      if (!found) return { ok: false, error: "Invalid email or password." };
      const { password: _pw, ...safe } = found;
      persist(safe);
      return { ok: true };
    },
    [persist],
  );

  const loginAs = useCallback(
    (role: Role) => {
      const found = DEMO_ACCOUNTS.find((a) => a.role === role)!;
      const { password: _pw, ...safe } = found;
      persist(safe);
    },
    [persist],
  );

  const value = useMemo(
    () => ({ user, ready, login, loginAs, logout: () => persist(null) }),
    [user, ready, login, loginAs, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
