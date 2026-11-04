import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
  } from 'react';
  import * as api from '../lib/api';
  
  type AuthContextValue = {
    user: api.User | null;
    loading: boolean;
    requestOtp: (phone: string) => Promise<void>;
    verifyOtp: (phone: string, code: string) => Promise<void>;
    signOut: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContextValue | null>(null);
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<api.User | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      let cancelled = false;
      api
        .restoreSession()
        .then((u) => {
          if (!cancelled) setUser(u);
        })
        .catch(() => {
          if (!cancelled) setUser(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []);
  
    const requestOtp = useCallback(async (phone: string) => {
      await api.requestOtp(phone);
    }, []);
  
    const verifyOtp = useCallback(async (phone: string, code: string) => {
      const u = await api.verifyOtp(phone, code);
      setUser(u);
    }, []);
  
    const signOut = useCallback(async () => {
      try {
        await api.signOut();
      } finally {
        setUser(null);
      }
    }, []);
  
    const value = useMemo(
      () => ({ user, loading, requestOtp, verifyOtp, signOut }),
      [user, loading, requestOtp, verifyOtp, signOut],
    );
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
  }