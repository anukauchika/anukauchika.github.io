import { lowUserPrefs } from '@low/user-prefs'

export interface UserPrefsRepo {
  getTheme(): Promise<string | null>
  setTheme(theme: string): Promise<void>
  getDatasetId(): Promise<string | null>
  setDatasetId(id: string): Promise<void>
  getDrillIntroSeen(): Promise<boolean>
  setDrillIntroSeen(): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const datUserPrefs: UserPrefsRepo = {
  getTheme: () => lowUserPrefs.getTheme(),
  setTheme: (theme) => lowUserPrefs.setTheme(theme),
  getDatasetId: () => lowUserPrefs.getDatasetId(),
  setDatasetId: (id) => lowUserPrefs.setDatasetId(id),
  getDrillIntroSeen: () => lowUserPrefs.getDrillIntroSeen(),
  setDrillIntroSeen: () => lowUserPrefs.setDrillIntroSeen(),
  switchDatabase: (userId) => lowUserPrefs.switchDatabase(userId),
}
