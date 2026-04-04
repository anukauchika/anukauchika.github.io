import { datUserPrefs } from '@dat/user-prefs'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'uch-theme'

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(THEME_KEY, theme)
  const color = theme === 'dark' ? '#1a1a1e' : '#f6efe8'
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(el => { el.content = color })
}

function detectSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface UserPrefsService {
  loadTheme(): Promise<void>
  toggleTheme(): Promise<void>
  getDatasetId(): Promise<string | null>
  setDatasetId(id: string): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const svcUserPrefs: UserPrefsService = {
  async loadTheme() {
    const saved = await datUserPrefs.getTheme()
    applyTheme((saved as Theme) ?? detectSystemTheme())
  },

  async toggleTheme() {
    const current = document.documentElement.dataset.theme ?? detectSystemTheme()
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    await datUserPrefs.setTheme(next)
  },

  getDatasetId: () => datUserPrefs.getDatasetId(),
  setDatasetId: (id) => datUserPrefs.setDatasetId(id),
  switchDatabase: (userId) => datUserPrefs.switchDatabase(userId),
}
