const PREFIX = 'memris:'

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
