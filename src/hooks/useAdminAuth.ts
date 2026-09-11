import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { isAdminUser } from "../lib/admins";
import { connexionGoogle, messageErreurAuth, recupererRedirection } from "../lib/googleSignIn";

const DEV_BYPASS_KEY = "ti_dev_admin_bypass";

/** Porte de l'admin : Google d'abord (Élise et Alex entrent avec leur compte Google, reconnu par
 *  courriel vérifié dans `lib/admins.ts`), courriel et mot de passe en second. Un compte connecté
 *  qui n'est pas admin reste connecté et voit « Changer de compte » plutôt qu'un mur muet. */
export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devBypass, setDevBypass] = useState(
    () => import.meta.env.DEV && sessionStorage.getItem(DEV_BYPASS_KEY) === "1",
  );

  useEffect(() => {
    void recupererRedirection(auth);
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const authed = !loading && (isAdminUser(user) || devBypass);
  /** Connecté, mais pas dans la liste des administratrices. */
  const notAdmin = !loading && !!user && !isAdminUser(user);

  const loginGoogle = async (): Promise<void> => {
    setError(null);
    try {
      await connexionGoogle(auth);
    } catch (err) {
      console.error("Connexion Google (admin) :", err);
      setError(messageErreurAuth(err));
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch {
      setError("Courriel ou mot de passe invalide.");
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

  return { authed, loading, notAdmin, user, error, login, loginGoogle, logout, enableDevBypass };
};
