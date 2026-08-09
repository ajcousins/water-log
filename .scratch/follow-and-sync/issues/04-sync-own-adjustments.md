# 04 — Sync own Adjustments when signed in

**What to build:** When signed in, the user’s **Adjustments** sync across their devices so Daily Totals match. Offline logging still updates the Vessel immediately and queues sync. Settings stay on the device.

**Blocked by:** 02 — Local Adjustments as the storage unit; 03 — Account signup / sign-in / sign-out in Settings

**Status:** ready-for-agent

- [ ] Only Adjustments made after the Account exists sync (no anonymous history backfill on signup)
- [ ] On sign-in, remote data replaces overlapping anonymous local Days (remote wins)
- [ ] On sign-out, local numbers are kept as anonymous data; session ends
- [ ] While signed in and the app is open, device pulls remote Adjustments about every 30 seconds
- [ ] Offline: UI updates immediately; sync queues until back online
- [ ] Concurrent Adjustments from two devices merge by accumulation (Daily Total = max(0, sum))
- [ ] Settings are not synced
- [ ] Adjustments (and related) tables created with **RLS enabled** and policies so a user can only read/write their own rows via the publishable key + Auth session (RLS was not enabled in ticket 01)
- [ ] Tests use the remote façade fake for sync/sign-in rules
