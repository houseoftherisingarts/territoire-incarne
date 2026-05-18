import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { isAdmin } from "../lib/admins";

const DEV_BYPASS_KEY = "ti_dev_admin_bypass";

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(
    () => import.meta.env.DEV && sessionStorage.getItem(DEV_BYPASS_KEY) === "1",
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const authed = !loading && (isAdmin(user?.uid) || devBypass);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (!isAdmin(cred.user.uid)) {
        await signOut(auth);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const enableDevBypass = () => {
    if (!import.meta.env.DEV) return;
    sessionStorage.setItem(DEV_BYPASS_KEY, "1");
    setDevBypass(true);
  };

  const logout = async () => {
    sessionStorage.removeItem(DEV_BYPASS_KEY);
    setDevBypass(false);
    await signOut(auth);
  };

  return { authed, loading, login, logout, enableDevBypass };
};
