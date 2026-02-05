import * as supabaseAuth from './api/supabase-auth.js'

export const api = {
  auth: {
    getSession: supabaseAuth.getSession,
    onAuthStateChange: supabaseAuth.onAuthStateChange,
    signInWithGoogle: supabaseAuth.signInWithGoogle,
    signInWithApple: supabaseAuth.signInWithApple,
    signOut: supabaseAuth.signOut,
  },
}
