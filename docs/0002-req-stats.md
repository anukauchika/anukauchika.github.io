# Server side stats

## kind = 'chinese'

Group session (per group practice):
- user
- dataset id
- group id
- started at
- done at

Word attempt (per word in session):
- group session id
- word id
- started at
- done at

Char log (per char success):
- word attempt id
- char index
- started at
- done at
- error count

Storage:
- Supabase with RLS
- Offline-first: IndexedDB → sync → delete local
- Background sync on app start

Display:
- All current stats views use this log
- Timestamps: UTC in DB, local on client
- No stats when not logged in (hints to log in for progress tracking)

## Migrations

Supabase versioned migrations via GitHub Actions
