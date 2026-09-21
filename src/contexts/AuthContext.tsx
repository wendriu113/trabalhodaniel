import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebase, firebaseReady } from '../config/firebase';
import type { UserProfile } from '../types';
import { errorMessage } from '../utils/errors';

type AuthState = { user: User | null; profile: UserProfile | null; isAdmin: boolean; loading: boolean; error: string; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null), [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setAdmin] = useState(false), [loading, setLoading] = useState(firebaseReady), [error, setError] = useState('');
  useEffect(() => {
    if (!firebaseReady) return;
    let stopProfile = () => {}, generation = 0;
    const stop = onIdTokenChanged(firebase().auth, async current => {
      const version = ++generation;
      stopProfile(); setProfile(null); setAdmin(false); setLoading(true); setError(''); setUser(current);
      if (!current) { setLoading(false); return; }
      try {
        const token = await current.getIdTokenResult();
        if (version !== generation) return;
        if (token.claims.admin === true) { setAdmin(true); setLoading(false); return; }
        stopProfile = onSnapshot(doc(firebase().db, 'users', current.uid), snapshot => {
          if (version !== generation) return;
          setProfile(snapshot.exists() ? snapshot.data() as UserProfile : null); setLoading(false);
        }, e => { if (version === generation) { setError(errorMessage(e)); setLoading(false); } });
      } catch (e) { if (version === generation) { setError(errorMessage(e)); setLoading(false); } }
    });
    return () => { generation++; stop(); stopProfile(); };
  }, []);
  return <AuthContext.Provider value={{ user, profile, isAdmin, loading, error,
    login: async (email, password) => { await signInWithEmailAndPassword(firebase().auth, email.trim(), password); },
    logout: () => signOut(firebase().auth),
  }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente.');
  return context;
}
