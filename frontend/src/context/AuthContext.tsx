import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User { email: string; name: string; role: string; }
interface AuthCtx {
  user: User | null; token: string | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.me().then(u => setUser(u)).catch(() => { localStorage.removeItem('token'); setToken(null); })
             .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [token]);

  const login = async (email: string, password: string) => {
    const r = await api.login(email, password);
    localStorage.setItem('token', r.token);
    setToken(r.token);
    setUser({ email, name: r.name, role: r.role });
  };

  const register = async (name: string, email: string, password: string) => {
    const r = await api.register(name, email, password);
    localStorage.setItem('token', r.token);
    setToken(r.token);
    setUser({ email, name: r.name, role: 'student' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, token, loading, login, register, logout }}>
    {children}
  </Ctx.Provider>;
}
