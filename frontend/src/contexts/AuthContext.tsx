import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      // Fehler weiterwerfen, damit die Login-Komponente ihn behandeln kann
      throw error;
    }
  };

  const guestLogin = async () => {
    try {
      const data = await authAPI.guestLogin();
      setUser(data.user);
    } catch (error: any) {
      console.error('Guest login error:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const data = await authAPI.register(email, username, password);
      setUser(data.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      // Fehler weiterwerfen, damit die Register-Komponente ihn behandeln kann
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        guestLogin,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
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
