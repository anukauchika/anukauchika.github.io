// TODO: Remove after 2026-03-06 — legacy database cleanup
indexedDB.deleteDatabase('memris-prefs')

const DB_PREFIX = 'uch-prefs'
const DB_VERSION = 1
const PREFS_STORE = 'prefs'
const ANON_ID = '00000000-0000-0000-0000-000000000000'

function openDb(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(PREFS_STORE)) {
        db.createObjectStore(PREFS_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dbName(userId) {
  return `${DB_PREFIX}-${userId || ANON_ID}`
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

let currentDb = null
let dbPromise = openDb(dbName(null))
dbPromise.then((db) => { currentDb = db })

export async function switchPrefsDatabase(userId) {
  if (currentDb) {
    currentDb.close()
    currentDb = null
  }
  dbPromise = openDb(dbName(userId))
  currentDb = await dbPromise
}

export const prefsRepo = {
  async get(key) {
    const db = await dbPromise
    const store = db.transaction(PREFS_STORE, 'readonly').objectStore(PREFS_STORE)
    const result = await reqToPromise(store.get(key))
    return result?.value ?? null
  },

  async set(key, value) {
    const db = await dbPromise
    const store = db.transaction(PREFS_STORE, 'readwrite').objectStore(PREFS_STORE)
    await reqToPromise(store.put({ key, value }))
  },
}
