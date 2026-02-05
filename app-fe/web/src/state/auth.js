import { writable, derived } from 'svelte/store'
import { api } from '../api.js'

export const session = writable(null)

export const user = derived(session, ($session) => $session?.user ?? null)

export const isAuthenticated = derived(user, ($user) => $user !== null)

export async function initAuth() {
  const initialSession = await api.auth.getSession()
  session.set(initialSession)

  api.auth.onAuthStateChange((newSession) => {
    session.set(newSession)
  })
}

export const signInWithGoogle = api.auth.signInWithGoogle
export const signInWithApple = api.auth.signInWithApple
export const signOut = api.auth.signOut
