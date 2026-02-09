// TODO: Remove after 2026-03-06 — legacy database cleanup
indexedDB.deleteDatabase('memris-prefs')

import { req, createDatabase } from './idb'

const PREFS_STORE = 'prefs'

const prefsDb = createDatabase('uch-prefs', 1, (db) => {
  if (!db.objectStoreNames.contains(PREFS_STORE)) {
    db.createObjectStore(PREFS_STORE, { keyPath: 'key' })
  }
})

export async function switchPrefsDatabase(userId: string | null): Promise<void> {
  await prefsDb.switchUser(userId)
}

export const prefsRepo = {
  async get(key: string): Promise<any> {
    const db = await prefsDb.db()
    const store = db.transaction(PREFS_STORE, 'readonly').objectStore(PREFS_STORE)
    const result = await req(store.get(key))
    return result?.value ?? null
  },

  async set(key: string, value: any): Promise<void> {
    const db = await prefsDb.db()
    const store = db.transaction(PREFS_STORE, 'readwrite').objectStore(PREFS_STORE)
    await req(store.put({ key, value }))
  },
}
