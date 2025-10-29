import type { User } from "@kakiage/server/rpc";
import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";

import { getLoggedInUser, getLogoutLink } from "@/libs/api";

class AuthService {
  public user: User | null = null;
  public isLoading: boolean = true;
  public error: Error | null = null;

  private loadPromise: Promise<void> | null = null;
  private listeners: Set<() => void> = new Set();

  private snapshot: {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
  };

  constructor() {
    this.snapshot = this.getSnapshotValues();
  }

  private getSnapshotValues = () => {
    return {
      user: this.user,
      isLoading: this.isLoading,
      error: this.error,
    };
  };

  private notify = () => {
    this.snapshot = this.getSnapshotValues();
    this.listeners.forEach(listener => void listener());
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => {
    return this.snapshot;
  };

  getUser = () => this.user;

  setUser = (user: User | null) => {
    this.user = user;
    this.notify();
  };

  logout = async () => {
    try {
      window.location.href = getLogoutLink();
      this.user = null;
      this.notify();
    } catch (err) {
      console.error("Logout failed:", err);
      if (err instanceof Error) {
        this.error = err;
        this.notify();
      }
    }
  };

  private loadUser = async () => {
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const userData = await getLoggedInUser();
      this.user = userData;
    } catch (err) {
      this.user = null;
      if (err instanceof Error && err.message !== "Unauthorized") {
        this.error = err;
      }
    } finally {
      this.isLoading = false;
      this.notify();
    }
  };

  ensureLoaded = () => {
    if (!this.loadPromise) {
      this.loadPromise = this.loadUser();
    }
    return this.loadPromise;
  };
}

export const authService = new AuthService();

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  getUser: () => User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    authService.ensureLoaded();
  }, []);

  const { user, isLoading, error } = useSyncExternalStore(authService.subscribe, authService.getSnapshot);

  const value: AuthContextType = {
    user,
    isAdmin: user?.role === "admin",
    isLoading,
    error,
    logout: authService.logout,
    setUser: authService.setUser,
    getUser: authService.getUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
