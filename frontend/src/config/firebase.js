import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { env } from "./env";

const CACHE_KEY = "sumanai_firebase_config";

const FALLBACK_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sumanai-sumanonline.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sumanai-sumanonline",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sumanai-sumanonline.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "105425138849",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:105425138849:web:c4d525230ab81f45ef2ce0"
};

function getStoredConfig() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    void err;
  }
  return null;
}

export async function fetchRemoteConfig() {
  const workerUrl = env.WORKER_URL ? env.WORKER_URL.replace(/\/+$/, '') : '';
  if (!workerUrl) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${workerUrl}/api/config`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.firebase?.apiKey) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.firebase));
        } catch (err) {
          void err;
        }
        return data.firebase;
      }
    }
  } catch (err) {
    void err;
  }
  return null;
}

const firebaseState = {
  app: null,
  auth: null,
  db: null,
  googleProvider: new GoogleAuthProvider(),
};

const activeConfig = getStoredConfig() || FALLBACK_CONFIG;
if (activeConfig?.apiKey) {
  firebaseState.app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
  firebaseState.auth = getAuth(firebaseState.app);
  firebaseState.db = getFirestore(firebaseState.app);
}

export function getFirebaseAuth() {
  return firebaseState.auth;
}

export function getFirebaseDb() {
  return firebaseState.db;
}

export function getFirebaseApp() {
  return firebaseState.app;
}

export const googleProvider = firebaseState.googleProvider;

export const app = firebaseState.app;
export const auth = firebaseState.auth;
export const db = firebaseState.db;

export async function initFirebase() {
  if (firebaseState.auth) return firebaseState;

  const remote = await fetchRemoteConfig();
  const config = remote || getStoredConfig() || FALLBACK_CONFIG;
  if (config?.apiKey) {
    if (!firebaseState.app) {
      firebaseState.app = getApps().length > 0 ? getApp() : initializeApp(config);
    }
    firebaseState.auth = getAuth(firebaseState.app);
    firebaseState.db = getFirestore(firebaseState.app);
  }
  return firebaseState;
}

export default firebaseState.app;
