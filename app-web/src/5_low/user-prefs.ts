import { prefsGet, prefsSet, prefsSwitchUser } from '@low/prefs-db'

export interface LowUserPrefs {
  getTheme(): Promise<string | null>
  setTheme(theme: string): Promise<void>
  getDatasetId(): Promise<string | null>
  setDatasetId(id: string): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const lowUserPrefs: LowUserPrefs = {
  getTheme: () => prefsGet('theme') as Promise<string | null>,
  setTheme: (theme) => prefsSet('theme', theme),
  getDatasetId: () => prefsGet('datasetId') as Promise<string | null>,
  setDatasetId: (id) => prefsSet('datasetId', id),
  switchDatabase: (userId) => prefsSwitchUser(userId),
}
