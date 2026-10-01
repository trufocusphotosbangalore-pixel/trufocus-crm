import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from './client'

export async function fetchCollectionData<T = any>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName)
    const snapshot = await getDocs(colRef)
    const items: T[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      // If data is wrapped in a payload/data envelope or direct record
      if (data && data.data !== undefined) {
        if (Array.isArray(data.data)) {
          items.push(...data.data)
        } else {
          items.push({ id: d.id, ...data.data })
        }
      } else {
        items.push({ id: d.id, ...data } as unknown as T)
      }
    })
    return items
  } catch (error) {
    console.warn(`[Firestore] Error fetching collection ${collectionName}:`, error)
    return []
  }
}

export async function saveDocument(collectionName: string, id: string, data: any): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id)
    await setDoc(docRef, {
      id,
      data,
      updated_at: new Date().toISOString()
    }, { merge: true })
    return true
  } catch (error) {
    console.warn(`[Firestore] Error saving document to ${collectionName}/${id}:`, error)
    return false
  }
}

export async function removeDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.warn(`[Firestore] Error removing document ${collectionName}/${id}:`, error)
    return false
  }
}
