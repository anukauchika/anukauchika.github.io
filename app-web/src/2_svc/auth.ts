import { datAuth } from '@dat/auth'
import { datDrillSync } from '@dat/kind/chinese/drill'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcDataset } from '@svc/dataset'
import { svcSync } from '@svc/sync'

async function onUserChanged(userId: string | null): Promise<void> {
  await datDrillSync.switchDatabase(userId)
  await svcDataset.reloadPrefs()
  if (userId) {
    await svcSync.syncPending()
    await svcSync.restoreFromServer()
  }
  sttAuth.dbVersion++
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
      onUserChanged(user.id).catch((e) => console.error('sync failed', e))
    }

    datAuth.onAuthChange((newUser) => {
      sttAuth.user = newUser
      onUserChanged(newUser?.id ?? null).catch((e) => console.error('sync failed', e))
    })

    // Refresh token when tab becomes visible (timers are throttled in background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        datAuth.refreshSession().catch(() => {})
      }
    })
  },

  signInWithGoogle: () => datAuth.signInWithGoogle(),
  signInWithApple: () => datAuth.signInWithApple(),
  signInWithEmail: (email) => datAuth.signInWithEmail(email),
  signOut: () => datAuth.signOut(),
}
