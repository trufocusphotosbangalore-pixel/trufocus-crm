/**
 * Firebase Firestore Compatibility Bridge for legacy `supabase` queries.
 * Emulates the .from(table).select().insert().update().delete().eq().single() API
 * and delegates read/write calls to Firestore collections directly!
 */
import { db, auth } from '@/services/firebase/client'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'

class FirestoreQueryBuilder {
  private colName: string
  private filters: Array<{ field: string; op: any; value: any }> = []
  private singleMode = false

  constructor(colName: string) {
    this.colName = colName
  }

  select(fields = '*') {
    return this
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: '==', value })
    return this
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: '!=', value })
    return this
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values })
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  maybeSingle() {
    this.singleMode = true
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    return this
  }

  limit(count: number) {
    return this
  }

  async then(resolve: (val: any) => void, reject?: (err: any) => void) {
    try {
      const colRef = collection(db, this.colName)
      let q = query(colRef)
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.value))
      }

      const snap = await getDocs(q)
      const list: any[] = []
      snap.forEach((d) => {
        const row = d.data()
        const unnested = (row && row.data !== undefined) ? (typeof row.data === 'object' ? { id: d.id, ...row.data } : row.data) : { id: d.id, ...row }
        list.push(unnested)
      })

      if (this.singleMode) {
        resolve({ data: list[0] || null, error: list.length === 0 ? { message: 'Row not found' } : null })
      } else {
        resolve({ data: list, error: null })
      }
    } catch (e: any) {
      resolve({ data: this.singleMode ? null : [], error: e })
    }
  }

  async insert(recordOrRecords: any) {
    try {
      const items = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords]
      for (const item of items) {
        const id = item.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        await setDoc(doc(db, this.colName, id), { id, data: item, updated_at: new Date().toISOString() }, { merge: true })
      }
      return { data: items, error: null }
    } catch (e: any) {
      return { data: null, error: e }
    }
  }

  async upsert(recordOrRecords: any) {
    return this.insert(recordOrRecords)
  }

  async update(updates: any) {
    try {
      const colRef = collection(db, this.colName)
      let q = query(colRef)
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.value))
      }
      const snap = await getDocs(q)
      const promises: Promise<any>[] = []
      snap.forEach((d) => {
        promises.push(updateDoc(doc(db, this.colName, d.id), { ...updates, updated_at: new Date().toISOString() }))
      })
      await Promise.all(promises)
      return { data: updates, error: null }
    } catch (e: any) {
      return { data: null, error: e }
    }
  }

  async delete() {
    try {
      const colRef = collection(db, this.colName)
      let q = query(colRef)
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.value))
      }
      const snap = await getDocs(q)
      const promises: Promise<any>[] = []
      snap.forEach((d) => {
        promises.push(deleteDoc(doc(db, this.colName, d.id)))
      })
      await Promise.all(promises)
      return { data: null, error: null }
    } catch (e: any) {
      return { data: null, error: e }
    }
  }
}

export const supabase: any = {
  from(tableName: string) {
    return new FirestoreQueryBuilder(tableName)
  },
  auth: {
    async getSession() {
      const current = auth.currentUser
      return {
        data: {
          session: current ? {
            user: { id: current.uid, email: current.email }
          } : null
        },
        error: null
      }
    },
    async signOut() {
      await auth.signOut()
      return { error: null }
    },
    onAuthStateChange(cb: any) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  },
  channel(name: string) {
    return {
      on: () => ({ subscribe: (cb: any) => cb && cb('SUBSCRIBED') }),
      subscribe: (cb: any) => cb && cb('SUBSCRIBED')
    }
  },
  removeChannel() {}
}
