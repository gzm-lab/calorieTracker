import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  jwt: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem('jwt'));

  useEffect(() => {
    if (jwt) {
      localStorage.setItem('jwt', jwt);
    } else {
      localStorage.removeItem('jwt');
    }
  }, [jwt]);

  const login = (token: string) => setJwt(token);
  const logout = () => setJwt(null);

  return (
    <AuthContext.Provider value={{ jwt, login, logout, isAuthenticated: !!jwt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 