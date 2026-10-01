import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyD4F3O_YKM3xA4TAdExAmGWUeamdJGlnUQ',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'trufocus-crm.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'trufocus-crm',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'trufocus-crm.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '914937309335',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:914937309335:web:2b981c18408a08bc7de1d2',
}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
