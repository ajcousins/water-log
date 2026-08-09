# 02 — Local Adjustments as the storage unit

**What to build:** Logging water stores **Adjustments**; the Vessel and totals still show **Daily Total** = max(0, sum of that Day’s Adjustments). Anonymous local use behaves as today. Existing single-total local data migrates so users don’t lose history.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Small, Large, and Custom Add/Remove record Adjustments (not a replaced single total write)
- [ ] Daily Total displayed and used for fireworks/fill is max(0, sum of Adjustments) for the selected Day
- [ ] Adjustment list is not shown in the UI
- [ ] Prior local Daily Totals migrate into an equivalent Adjustment (or equivalent sum) so existing users keep their numbers
- [ ] Domain and local persistence tests cover sum/floor and persistence behaviour
