import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { formatAuthError } from "../lib/firebaseAuthErrors";
import { getFirebaseAuth } from "../lib/firebase";
import { saveUserNickname } from "../lib/userProfile";

type AuthState = {
  user: User | null;
  ready: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      throw new Error(formatAuthError(e));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      throw new Error(formatAuthError(e));
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOutUser,
    }),
    [user, ready, signIn, signUp, signOutUser],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook
export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export async function persistNickname(uid: string, nickname: string): Promise<void> {
  await saveUserNickname(uid, nickname);
}
