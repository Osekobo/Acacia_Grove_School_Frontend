import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { clearTokens, getAccessToken, setTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [booting, setBooting] = useState(Boolean(getAccessToken()));

  const loadMe = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    setPermissions(data.permissions || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) return;
      try {
        await loadMe();
      } catch {
        if (!cancelled) clearTokens();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setPermissions([]);
    };
    window.addEventListener("bh:logout", onLogout);
    return () => window.removeEventListener("bh:logout", onLogout);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      await loadMe();
      return data.user;
    },
    [loadMe],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setPermissions([]);
  }, []);

  const has = useCallback((permission) => permissions.includes(permission), [permissions]);

  const value = useMemo(
    () => ({ user, permissions, booting, login, logout, has, reload: loadMe }),
    [user, permissions, booting, login, logout, has, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}