/**
 * Null implementation — documents the contract any prefs repo must satisfy.
 */
export function createNullPrefsRepo() {
  return {
    get(key) { return null },
    set(key, value) {},
  }
}
