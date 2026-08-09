# 06 — Follow marker on the Vessel

**What to build:** After an accepted **Follow**, the follower sees the followed user’s level on the Vessel for the selected Day (projection only), with correct placement, clamp, label, and ~30s refresh.

**Blocked by:** 04 — Sync own Adjustments when signed in; 05 — Follow Request and Follow management

**Status:** resolved

- [x] Marker uses followed user’s Daily Total for the selected calendar date string; hidden when missing or 0
- [x] Position is absolute ml on the viewer’s Maximum Target scale, clamped at Vessel top; true ml shown beneath when at or above Maximum Target
- [x] Marker inside Vessel, left of centre: inverted triangle; label `username @ time` (latest Adjustment time in viewer’s local timezone)
- [x] Followers receive only Daily Total + latest Adjustment time (not raw Adjustments); unreadable without an accepted Follow (**RLS / policies** enforce this — RLS was not enabled in ticket 01)
- [x] Refresh about every 30 seconds while the app is open
- [x] Domain tests cover visibility, clamp, and overshoot amount rules
