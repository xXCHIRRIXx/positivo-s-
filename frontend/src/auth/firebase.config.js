import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- 1. Importa getAuth
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBqDZunNe7eCYEOHrBpvkEj-oy-Ut_0IDs",
  authDomain: "positivos-fd164.firebaseapp.com",
  projectId: "positivos-fd164",
  storageBucket: "positivos-fd164.firebasestorage.app",
  messagingSenderId: "653262066189",
  appId: "1:653262066189:web:affaa2dfd53a95cc53bb44",
  measurementId: "G-MNHEZL9YCB"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportar base de datos y autenticación
export const db = getFirestore(app);
export const auth = getAuth(app); // <--- 2. Exporta auth aquí