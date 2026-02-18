import * as supabaseAuth from '@low/supabase/supabase-auth.js'
import * as supabaseStats from '@low/supabase/kind/chinese/stats.js'

export const api = {
  auth: {
    getSession: supabaseAuth.getSession,
    onAuthStateChange: supabaseAuth.onAuthStateChange,
    signInWithGoogle: supabaseAuth.signInWithGoogle,
    signInWithApple: supabaseAuth.signInWithApple,
    signInWithEmail: supabaseAuth.signInWithEmail,
    signOut: supabaseAuth.signOut,
    refreshSession: supabaseAuth.refreshSession,
  },
  stats: {
    createGroupSession: supabaseStats.createGroupSession,
    updateGroupSessionDone: supabaseStats.updateGroupSessionDone,
    insertWordAttempt: supabaseStats.insertWordAttempt,
    insertCharLogs: supabaseStats.insertCharLogs,
    fetchAllUserSessions: supabaseStats.fetchAllUserSessions,
    fetchWordAttempts: supabaseStats.fetchWordAttempts,
    fetchCharLogs: supabaseStats.fetchCharLogs,
  },
}
