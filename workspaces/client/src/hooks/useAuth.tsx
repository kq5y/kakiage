import type { User } from '@kakiage/server/rpc';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getLoggedInUser, getLogoutLink } from '@/libs/api';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  getUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getLoggedInUser();
        setUser(userData);
      } catch (err) {
        setUser(null);
        
        if (err instanceof Error && err.message !== 'Unauthorized') {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    try {
      window.location.href = getLogoutLink();
    } catch (err) {
      console.error('Logout failed:', err);
      if (err instanceof Error) {
        setError(err);
      }
    }
  };

  const getUser = () => user;

  return (
    <AuthContext.Provider value={{ user, isLoading, error, logout, setUser, getUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
