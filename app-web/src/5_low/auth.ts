import type { AuthUser } from '@dom/auth'
import { supabase } from '@low/supabase/supabase-client.js'

function mapUser(
  session: {
    user: {
      id: string
      email?: string
      created_at: string
      user_metadata?: { full_name?: string; avatar_url?: string }
    }
  } | null,
): AuthUser | null {
  if (!session) return null
  const u = session.user
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.email ?? '',
    avatarUrl: u.user_metadata?.avatar_url ?? '',
    createdAt: u.created_at,
  }
}

export interface AuthApi {
  getUser(): Promise<AuthUser | null>
  refreshSession(): Promise<void>
  onAuthChange(cb: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const lowAuth: AuthApi = {
  async getUser() {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      // Token may be stale — try refreshing before giving up
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        await supabase.auth.signOut({ scope: 'local' })
        return null
      }
      return mapUser(refreshData.session)
    }
    return mapUser(data.session)
  },

  async refreshSession() {
    await supabase.auth.refreshSession()
  },

  onAuthChange(cb) {
    let currentUserId: string | null = null
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null
      if (newUserId === currentUserId) return
      currentUserId = newUserId
      cb(mapUser(session))
    })
    return () => subscription.unsubscribe()
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/chinese/` },
    })
    if (error) throw error
  },

  async signInWithApple() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    })
    if (error) throw error
  },

  async signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/chinese/` },
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.warn('signOut error (ignored):', error.message)
  },
}
