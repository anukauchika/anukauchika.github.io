// Clean up legacy localStorage keys
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k?.startsWith('memris:')) localStorage.removeItem(k)
  }
  localStorage.removeItem('memris-stats-last-cleanup')
} catch { /* storage unavailable */ }

const PREFIX = 'uch:'

export function createLocalPrefsRepo() {
  return {
    get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key)
        return raw !== null ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
      } catch {
        // storage full or unavailable — silently ignore
      }
    },
  }
}
