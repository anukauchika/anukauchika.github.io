const ANON_ID = '00000000-0000-0000-0000-000000000000'

export function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function tx(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export interface DbHandle {
  db(): Promise<IDBDatabase>
  switchUser(userId: string | null): Promise<void>
}

export function createDatabase(prefix: string, version: number, onUpgrade: (db: IDBDatabase) => void): DbHandle {
  function open(userId: string | null): Promise<IDBDatabase> {
    const name = `${prefix}-${userId || ANON_ID}`
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(name, version)
      r.onupgradeneeded = (e) => onUpgrade((e.target as IDBOpenDBRequest).result)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  }

  let current: IDBDatabase | null = null
  let promise = open(null)
  promise.then((db) => {
    current = db
  })

  return {
    db() {
      return promise
    },
    async switchUser(userId: string | null) {
      if (current) {
        current.close()
        current = null
      }
      promise = open(userId)
      current = await promise
    },
  }
}
