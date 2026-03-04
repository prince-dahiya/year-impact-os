import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('year-impact-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const profile: UserProfile = { name: fullName, email, birthDate: '2003-01-01', expectedLifespan: 80 };
      localStorage.setItem('year-impact-user', JSON.stringify(profile));
      localStorage.setItem('year-impact-creds', JSON.stringify({ email, password }));
      setUser(profile);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const creds = localStorage.getItem('year-impact-creds');
      if (creds) {
        const parsed = JSON.parse(creds);
        if (parsed.email !== email || parsed.password !== password) {
          return { error: new Error('Invalid credentials') };
        }
      }
      const stored = localStorage.getItem('year-impact-user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        const profile: UserProfile = { name: email.split('@')[0], email };
        localStorage.setItem('year-impact-user', JSON.stringify(profile));
        setUser(profile);
      }
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = () => {
    setUser(null);
    // Don't clear data, just session
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('year-impact-user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
