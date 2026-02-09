
# RFC: IDB Layer

## Goal

Extract shared IDB primitives into a reusable module. Consolidate all client storage into IDB (remove localStorage usage).

## Approach

**`data/idb.ts`** — shared primitives:

- `req(request)` / `tx(transaction)` — promisify IDB operations
- `createDatabase(prefix, version, onUpgrade)` → `DbHandle` with `db()` and `switchUser(userId)`

**Two databases**, both via `createDatabase()`:
- **Stats** (`uch-stats-{userId}`) — sessions, word attempts, char logs. Synced to Supabase
- **Prefs** (`uch-prefs-{userId}`) — key-value. Local only

**`local-prefs-repo.js` removed** — its consumers switch to `idb-prefs-repo`.

**Business logic out** — `getWordStats` (aggregation) and `cleanupOldRecords` (maintenance) move to higher-level modules. IDB layer is pure read/write.

## Interface

```ts
// data/idb.ts

// Promisify any IDBRequest (read or write: get, put, getAll, delete, count, etc.)
function req<T>(request: IDBRequest<T>): Promise<T>

// Wait for a transaction to commit — used after writes to ensure durability
function tx(transaction: IDBTransaction): Promise<void>

interface DbHandle {
  // Returns current database connection (waits for open if needed)
  db(): Promise<IDBDatabase>
  // Closes current connection and opens database for a different user
  switchUser(userId: string | null): Promise<void>
}

// Creates a per-user database handle. prefix + userId form the db name.
// onUpgrade defines the schema (object stores, indexes).
function createDatabase(
  prefix: string,
  version: number,
  onUpgrade: (db: IDBDatabase) => void
): DbHandle
```

## Usage Examples

```ts
// --- Creating a database with schema ---
const statsDb = createDatabase('uch-stats', 1, (db) => {
  const sessions = db.createObjectStore('group_sessions', { keyPath: 'id' })
  sessions.createIndex('dataset_practice', ['dataset_id', 'practice_type'])
})

// --- Read ---
const db = await statsDb.db()
const store = db.transaction('group_sessions', 'readonly').objectStore('group_sessions')
const session = await req(store.get(id))
const all = await req(store.index('dataset_practice').getAll([datasetId, practiceType]))

// --- Write ---
const t = db.transaction('group_sessions', 'readwrite')
t.objectStore('group_sessions').put(session)
await tx(t)

// --- User switch (e.g. on login/logout) ---
await statsDb.switchUser('user-uuid-123')
```
