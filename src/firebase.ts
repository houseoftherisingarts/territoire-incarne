import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrVnqTfn1MdyOkSZufODMqbCQRADzUqZ4",
  authDomain: "territoireincarne-80bb9.firebaseapp.com",
  projectId: "territoireincarne-80bb9",
  storageBucket: "territoireincarne-80bb9.firebasestorage.app",
  messagingSenderId: "526716569625",
  appId: "1:526716569625:web:e892bc08df5f8210c38288",
  measurementId: "G-WHNBDWG5K2",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
