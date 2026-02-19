import type { AuthUser } from '@dom/auth'

class AuthState {
  user: AuthUser | null = $state(null)
  dbVersion: number = $state(0)

  get isAuthenticated(): boolean { return this.user !== null }
}

export const sttAuth = new AuthState()
