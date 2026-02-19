import type { AuthUser } from '@dom/auth'
import { lowAuth } from '@low/auth'

export interface AuthRepo {
  getUser(): Promise<AuthUser | null>
  refreshSession(): Promise<void>
  onAuthChange(cb: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const datAuth: AuthRepo = {
  getUser: () => lowAuth.getUser(),
  refreshSession: () => lowAuth.refreshSession(),
  onAuthChange: (cb) => lowAuth.onAuthChange(cb),
  signInWithGoogle: () => lowAuth.signInWithGoogle(),
  signInWithApple: () => lowAuth.signInWithApple(),
  signInWithEmail: (email) => lowAuth.signInWithEmail(email),
  signOut: () => lowAuth.signOut(),
}
