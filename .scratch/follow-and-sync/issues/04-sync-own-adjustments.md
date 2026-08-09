# 04 — Sync own Adjustments when signed in

**What to build:** When signed in, the user’s **Adjustments** sync across their devices so Daily Totals match. Offline logging still updates the Vessel immediately and queues sync. Settings stay on the device.

**Blocked by:** 02 — Local Adjustments as the storage unit; 03 — Account signup / sign-in / sign-out in Settings

**Status:** resolved

- [x] Only Adjustments made after the Account exists sync (no anonymous history backfill on signup)
- [x] On sign-in, remote data replaces overlapping anonymous local Days (remote wins)
- [x] On sign-out, local numbers are kept as anonymous data; session ends
- [x] While signed in and the app is open, device pulls remote Adjustments about every 30 seconds
- [x] Offline: UI updates immediately; sync queues until back online
- [x] Concurrent Adjustments from two devices merge by accumulation (Daily Total = max(0, sum))
- [x] Settings are not synced
- [x] **You:** Run `supabase/migrations/20260809_adjustments.sql` in the Supabase SQL Editor (RLS on)
- [x] Tests use the remote façade fake for sync/sign-in rules

## Comments

- Sync helpers + polling wired. Needs `adjustments` table migration before live sync works.
