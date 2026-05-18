import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { isAdmin } from "../lib/admins";

export interface ClientProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  status: "pending" | "accepted" | "refused";
  newsletterOptIn: boolean;
  createdAt: unknown;
}

let _signupOptOut = false;
/** Set by ClientLogin signup form before signUpWithEmail / signInWithGoogle is called.
 *  When true, the next user-doc creation will set newsletterOptIn=false. */
export const setSignupNewsletterOptOut = (optOut: boolean) => {
  _signupOptOut = optOut;
};

export const useClientAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      setUser(firebaseUser);

      if (firebaseUser && !isAdmin(firebaseUser.uid)) {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? "",
            email: firebaseUser.email ?? "",
            avatarUrl: firebaseUser.photoURL ?? "",
            status: "pending",
            newsletterOptIn: !_signupOptOut, // default opted IN unless user checked opt-out
            createdAt: serverTimestamp(),
          });
          _signupOptOut = false; // reset for next user
        }
        profileUnsub = onSnapshot(ref, (d) => {
          setProfile(d.data() as ClientProfile);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => { authUnsub(); if (profileUnsub) profileUnsub(); };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError("Erreur lors de la connexion Google. Veuillez réessayer.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Courriel ou mot de passe invalide.");
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    } catch {
      setError("Impossible de créer le compte. Ce courriel est peut-être déjà utilisé.");
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    await updateProfile(user, { displayName: name });
    await updateDoc(doc(db, "users", user.uid), { displayName: name });
  };

  const setNewsletterOptIn = async (value: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { newsletterOptIn: value });
  };

  const logout = () => firebaseSignOut(auth);

  return { user, profile, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, updateDisplayName, setNewsletterOptIn, logout };
};
