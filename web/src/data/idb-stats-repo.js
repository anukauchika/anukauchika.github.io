const DB_NAME = 'memris-stats'
const DB_VERSION = 3
const STATS_STORE = 'word_stats'
const LOG_STORE = 'practice_log'
const SESSION_STORE = 'group_sessions'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      const oldVersion = e.oldVersion

      if (oldVersion < 3) {
        // v3: full schema rebuild — adds practiceType dimension
        // Safe to drop: no production data exists before v3
        for (const name of [STATS_STORE, LOG_STORE, SESSION_STORE]) {
          if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)
        }

        const stats = db.createObjectStore(STATS_STORE, { keyPath: 'key' })
        stats.createIndex('dataset_type', ['datasetId', 'practiceType'], { unique: false })
        stats.createIndex('dataset_type_group', ['datasetId', 'practiceType', 'groupId'], { unique: false })

        const log = db.createObjectStore(LOG_STORE, { keyPath: 'id', autoIncrement: true })
        log.createIndex('word_key', ['datasetId', 'practiceType', 'groupId', 'wordId'], { unique: false })

        const sessions = db.createObjectStore(SESSION_STORE, { keyPath: 'id', autoIncrement: true })
        sessions.createIndex('dataset_type', ['datasetId', 'practiceType'], { unique: false })
        sessions.createIndex('dataset_type_group', ['datasetId', 'practiceType', 'groupId'], { unique: false })
      }

      // Future migrations go here:
      // if (oldVersion < 4) { ... }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function makeKey(datasetId, practiceType, groupId, wordId) {
  return `${datasetId}::${practiceType}::${groupId}::${wordId}`
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIdbStatsRepo() {
  const dbPromise = openDb()

  return {
    async recordSuccess(datasetId, practiceType, groupId, wordId) {
      const db = await dbPromise
      const now = new Date().toISOString()
      const key = makeKey(datasetId, practiceType, groupId, wordId)

      const tx = db.transaction([STATS_STORE, LOG_STORE], 'readwrite')
      const statsStore = tx.objectStore(STATS_STORE)
      const logStore = tx.objectStore(LOG_STORE)

      const existing = await reqToPromise(statsStore.get(key))
      const record = existing || {
        key,
        datasetId,
        practiceType,
        groupId,
        wordId,
        successCount: 0,
        lastPracticedAt: null,
      }
      record.successCount += 1
      record.lastPracticedAt = now

      statsStore.put(record)
      logStore.add({ datasetId, practiceType, groupId, wordId, practicedAt: now })

      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
    },

    async getStat(datasetId, practiceType, groupId, wordId) {
      const db = await dbPromise
      const store = db.transaction(STATS_STORE, 'readonly').objectStore(STATS_STORE)
      return (await reqToPromise(store.get(makeKey(datasetId, practiceType, groupId, wordId)))) || null
    },

    async getGroupStats(datasetId, practiceType, groupId) {
      const db = await dbPromise
      const store = db.transaction(STATS_STORE, 'readonly').objectStore(STATS_STORE)
      const index = store.index('dataset_type_group')
      return reqToPromise(index.getAll([datasetId, practiceType, groupId]))
    },

    async getDatasetStats(datasetId, practiceType) {
      const db = await dbPromise
      const store = db.transaction(STATS_STORE, 'readonly').objectStore(STATS_STORE)
      const index = store.index('dataset_type')
      return reqToPromise(index.getAll([datasetId, practiceType]))
    },

    async getWordLog(datasetId, practiceType, groupId, wordId) {
      const db = await dbPromise
      const store = db.transaction(LOG_STORE, 'readonly').objectStore(LOG_STORE)
      const index = store.index('word_key')
      return reqToPromise(index.getAll([datasetId, practiceType, groupId, wordId]))
    },

    async recordGroupSession(session) {
      const db = await dbPromise
      const store = db.transaction(SESSION_STORE, 'readwrite').objectStore(SESSION_STORE)
      await reqToPromise(store.add(session))
    },

    async getGroupSessions(datasetId, practiceType, groupId) {
      const db = await dbPromise
      const store = db.transaction(SESSION_STORE, 'readonly').objectStore(SESSION_STORE)
      const index = store.index('dataset_type_group')
      return reqToPromise(index.getAll([datasetId, practiceType, groupId]))
    },

    async getDatasetSessions(datasetId, practiceType) {
      const db = await dbPromise
      const store = db.transaction(SESSION_STORE, 'readonly').objectStore(SESSION_STORE)
      const index = store.index('dataset_type')
      return reqToPromise(index.getAll([datasetId, practiceType]))
    },
  }
}
