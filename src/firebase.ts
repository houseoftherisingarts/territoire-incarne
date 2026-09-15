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
  // Le domaine Firebase, pas celui du site : le client OAuth que Firebase a créé n'accepte
  // que https://territoireincarne-80bb9.firebaseapp.com/__/auth/handler comme adresse de
  // retour, et signInWithPopup marche partout avec lui. Passer au domaine du site donnerait
  // « Error 400: redirect_uri_mismatch » (vu le 15 septembre 2026) tant que cette adresse
  // n'est pas ajoutée au client dans Google Cloud, un geste de console qu'aucune API ne fait.
  authDomain: "territoireincarne-80bb9.firebaseapp.com",
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
