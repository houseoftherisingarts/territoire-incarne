import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrVnqTfn1MdyOkSZufODMqbCQRADzUqZ4",
  // L'authentification passe par le domaine du site lui-même quand il est servi depuis
  // territoireincarne.com : sinon la fenêtre Google s'ouvre sur un domaine tiers, Chrome
  // coupe les témoins, et la porte se referme sans connecter personne.
  authDomain:
    typeof window !== "undefined" && window.location.hostname.endsWith("territoireincarne.com")
      ? window.location.hostname
      : "territoireincarne-80bb9.firebaseapp.com",
  projectId: "territoireincarne-80bb9",
  storageBucket: "territoireincarne-80bb9.firebasestorage.app",
  messagingSenderId: "526716569625",
  appId: "1:526716569625:web:e892bc08df5f8210c38288",
  measurementId: "G-WHNBDWG5K2",
};

export const app = initializeApp(firebaseConfig);
// initializeAuth plutôt que getAuth : la persistance est nommée explicitement, dans l'ordre,
// et une base IndexedDB abîmée retombe sur le stockage local au lieu de bloquer la connexion.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const db = getFirestore(app);
export const storage = getStorage(app);
