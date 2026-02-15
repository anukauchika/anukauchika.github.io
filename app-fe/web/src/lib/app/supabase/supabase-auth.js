import { supabase } from './supabase-client.js'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    // Token may be stale — try refreshing before giving up
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      await supabase.auth.signOut({ scope: 'local' })
      return null
    }
    return refreshData.session
  }
  return data.session
}

export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) return null
  return data.session
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => subscription.unsubscribe()
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signInWithApple() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
  })
  if (error) throw error
}

export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  // Ignore errors (e.g. token already expired) — local state is cleared regardless
  if (error) console.warn('signOut error (ignored):', error.message)
}
