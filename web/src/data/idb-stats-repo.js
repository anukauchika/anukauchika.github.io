const DB_NAME = 'memris-stats'
const DB_VERSION = 4
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
        log.createIndex('dataset_type', ['datasetId', 'practiceType'], { unique: false })

        const sessions = db.createObjectStore(SESSION_STORE, { keyPath: 'id', autoIncrement: true })
        sessions.createIndex('dataset_type', ['datasetId', 'practiceType'], { unique: false })
        sessions.createIndex('dataset_type_group', ['datasetId', 'practiceType', 'groupId'], { unique: false })
      }

      // v4: add dataset_type index to practice_log for activity queries
      if (oldVersion < 4 && oldVersion >= 3) {
        const logStore = e.target.transaction.objectStore(LOG_STORE)
        logStore.createIndex('dataset_type', ['datasetId', 'practiceType'], { unique: false })
      }
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

      // Use separate transactions to avoid auto-commit issues with async/await
      // First, get existing stat
      const existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(STATS_STORE, 'readonly')
        const req = tx.objectStore(STATS_STORE).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

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

      // Then write both in a single transaction
      await new Promise((resolve, reject) => {
        const tx = db.transaction([STATS_STORE, LOG_STORE], 'readwrite')
        tx.objectStore(STATS_STORE).put(record)
        tx.objectStore(LOG_STORE).add({ datasetId, practiceType, groupId, wordId, practicedAt: now })
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

    async getDatasetPracticeLog(datasetId, practiceType) {
      const db = await dbPromise
      const store = db.transaction(LOG_STORE, 'readonly').objectStore(LOG_STORE)
      // Try using index, fall back to scanning all records
      if (store.indexNames.contains('dataset_type')) {
        const index = store.index('dataset_type')
        return reqToPromise(index.getAll([datasetId, practiceType]))
      }
      // Fallback: scan all records and filter
      const all = await reqToPromise(store.getAll())
      return all.filter(log => log.datasetId === datasetId && log.practiceType === practiceType)
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
