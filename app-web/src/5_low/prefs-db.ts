import { req, createDatabase } from '@low/idb'

const STORE = 'prefs'

const prefsDb = createDatabase('uch-prefs', 1, (db) => {
  if (!db.objectStoreNames.contains(STORE)) {
    db.createObjectStore(STORE, { keyPath: 'key' })
  }
})

export async function prefsGet(key: string): Promise<unknown> {
  const db = await prefsDb.db()
  const store = db.transaction(STORE, 'readonly').objectStore(STORE)
  const result = await req(store.get(key))
  return (result as { key: string; value: unknown } | undefined)?.value ?? null
}

export async function prefsSet(key: string, value: unknown): Promise<void> {
  const db = await prefsDb.db()
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
  await req(store.put({ key, value }))
}

export async function prefsSwitchUser(userId: string | null): Promise<void> {
  await prefsDb.switchUser(userId)
}
