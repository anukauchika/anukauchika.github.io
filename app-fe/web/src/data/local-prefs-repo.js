// TODO: Remove after 2026-03-06 — legacy localStorage cleanup
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k?.startsWith('memris:')) localStorage.removeItem(k)
  }
  localStorage.removeItem('memris-stats-last-cleanup')
} catch { /* storage unavailable */ }

const ANON_ID = '00000000-0000-0000-0000-000000000000'
let prefix = `uch:${ANON_ID}:`

export function switchLocalPrefs(userId) {
  prefix = `uch:${userId || ANON_ID}:`
}

export const localPrefs = {
  get(key) {
    try {
      const raw = localStorage.getItem(prefix + key)
      return raw !== null ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — silently ignore
    }
  },
}
