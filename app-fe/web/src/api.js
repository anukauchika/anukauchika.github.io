import * as supabaseAuth from './api/supabase-auth.js'
import * as supabaseStats from './api/supabase-stats.js'

export const api = {
  auth: {
    getSession: supabaseAuth.getSession,
    onAuthStateChange: supabaseAuth.onAuthStateChange,
    signInWithGoogle: supabaseAuth.signInWithGoogle,
    signInWithApple: supabaseAuth.signInWithApple,
    signOut: supabaseAuth.signOut,
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
