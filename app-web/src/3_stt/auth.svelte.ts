import type { AuthUser } from '@dom/auth'

class AuthState {
  #user: AuthUser | null = $state(null)
  dbVersion: number = $state(0)
  avatarError: boolean = $state(false)

  get user(): AuthUser | null { return this.#user }
  set user(v: AuthUser | null) { this.#user = v; this.avatarError = false }

  get isAuthenticated(): boolean { return this.user !== null }
  get avatarUrl(): string | undefined { return this.user?.avatarUrl }
  get userInitials(): string {
    if (this.user?.name) {
      const parts = this.user.name.trim().split(/\s+/)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return parts[0][0].toUpperCase()
    }
    return this.user?.email ? this.user.email[0].toUpperCase() : '?'
  }
  get showAvatar(): boolean { return !!(this.avatarUrl && !this.avatarError) }
}

export const sttAuth = new AuthState()
