import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types';
import { ACCOUNTS_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/lib/accountStorage';

interface StoredAccount {
  id: string;
  email: string;
  password: string;
  profile: UserProfile;
}

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
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    const accounts = readAccounts();
    const account = accounts.find(a => a.id === sessionId);
    if (account) {
      setUser(account.profile);
    }
    setLoading(false);
  }, []);

  const readAccounts = (): StoredAccount[] => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const writeAccounts = (accounts: StoredAccount[]) => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const accounts = readAccounts();
      if (accounts.some(account => account.email === normalizedEmail)) {
        return { error: new Error('Account already exists. Please sign in instead.') };
      }
      const profile: UserProfile = { name: fullName, email, birthDate: '2003-01-01', expectedLifespan: 80 };
      const account: StoredAccount = { id: crypto.randomUUID(), email: normalizedEmail, password, profile: { ...profile, email: normalizedEmail } };
      writeAccounts([...accounts, account]);
      localStorage.setItem(SESSION_STORAGE_KEY, account.id);
      setUser(profile);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const account = readAccounts().find(a => a.email === normalizedEmail);
      if (!account || account.password !== password) {
        return { error: new Error('Invalid credentials') };
      }
      localStorage.setItem(SESSION_STORAGE_KEY, account.id);
      setUser(account.profile);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      writeAccounts(readAccounts().map(account => account.id === sessionId ? { ...account, profile: updated } : account));
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
