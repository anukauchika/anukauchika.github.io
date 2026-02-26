import { datAuth } from '@dat/auth'
import { datDrillSync } from '@dat/kind/chinese/drill'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcDataset } from '@svc/dataset'
import { svcUserPrefs } from '@svc/user-prefs'
import { svcSync } from '@svc/sync'

async function switchDatabases(userId: string | null): Promise<void> {
  await datDrillSync.switchDatabase(userId)
  await svcUserPrefs.switchDatabase(userId)
  await svcDataset.reloadPrefs()
  sttAuth.dbVersion++
}

function syncInBackground(): void {
  svcSync.syncPending()
    .then(() => svcSync.restoreFromServer())
    .then(() => { sttAuth.dbVersion++ })
    .catch((e) => console.error('sync failed', e))
}

export interface AuthService {
  init(): Promise<void>
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const svcAuth: AuthService = {
  async init() {
    const user = await datAuth.getUser()
    sttAuth.user = user

    if (user) {
      await switchDatabases(user.id)
      syncInBackground()
    }

    datAuth.onAuthChange(async (newUser) => {
      sttAuth.user = newUser
      await switchDatabases(newUser?.id ?? null).catch((e) => console.error('db switch failed', e))
      if (newUser) syncInBackground()
    })


  },

  signInWithGoogle: () => datAuth.signInWithGoogle(),
  signInWithApple: () => datAuth.signInWithApple(),
  signInWithEmail: (email) => datAuth.signInWithEmail(email),
  signOut: () => datAuth.signOut(),
}
