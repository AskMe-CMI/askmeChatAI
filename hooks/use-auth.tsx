'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  type: 'regular';
  name: string;
  avatar: string;
  loginTime: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // Rely on cookie-based session. Call verify endpoint which reads the cookie server-side.
        const response = await fetch('/api/auth/verify', { method: 'GET' });

        if (response.ok) {
          const payload = await response.json();
          // Expect { ok: true, user }
          if (payload?.ok && payload.user) {
            setUser(payload.user);
            setToken(null); // token is HTTP-only cookie, not accessible to JS
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Server sets HTTP-only cookie 'session'. Client must rely on verify endpoint to read user.
        // Keep a shallow user object in client state for immediate UI updates.
        setUser(data.user || null);
        setToken(null);
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
  // Clear client state
  setToken(null);
  setUser(null);

  // Call logout API (server will clear cookie)
  fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
