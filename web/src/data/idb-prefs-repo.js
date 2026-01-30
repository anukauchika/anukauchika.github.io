const DB_NAME = 'memris-prefs'
const DB_VERSION = 1
const PREFS_STORE = 'prefs'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
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

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIdbPrefsRepo() {
  const dbPromise = openDb()

  return {
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
}
