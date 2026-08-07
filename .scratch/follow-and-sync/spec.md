Status: ready-for-agent

# Follow and sync

Domain vocabulary: [CONTEXT.md](../../CONTEXT.md). ADRs: [0002](../../docs/adr/0002-supabase-for-accounts-and-sync.md), [0003](../../docs/adr/0003-sync-adjustments-expose-daily-totals.md).

## Problem Statement

A user tracking water alone cannot see how someone they care about is doing on the same day. The app is local-only, so there is no way to share a Daily Total across devices or people, and no way to put another person’s level on the Vessel.

## Solution

Optional Accounts (username + password) sync Adjustments via Supabase so the user’s own Daily Totals stay consistent across signed-in devices. A user may Follow one other person at a time (after a consented Follow Request) and see that person’s level as a marker on their Vessel for the selected Day. Anonymous local use remains available without an Account.

## User Stories

1. As an anonymous user, I want to keep logging water with only local storage, so that I am not forced to create an Account.
2. As a user, I want to create an Account with a username and password from Settings, so that I can use Follow and multi-device sync.
3. As a user, I want to sign in with my username and password, so that I can resume my Account on this device.
4. As a user, I want to sign out, so that this device returns to anonymous local mode.
5. As a user signing up, I want prior anonymous history not uploaded, so that only Adjustments I make after the Account exists sync remotely.
6. As a user signing in on a device that already has anonymous Days, I want remote data to replace overlapping local Days, so that the Account is the source of truth.
7. As a signed-in user, I want Small, Large, and Custom to record Adjustments and update the Vessel immediately, so that the UI stays responsive.
8. As a signed-in user offline, I want Adjustments applied locally and queued for sync, so that I can still log water without network.
9. As a signed-in user with two devices open, I want each device to pull remote Adjustments about every 30 seconds, so that both show the same Daily Total.
10. As a signed-in user, I want Daily Total to be max(0, sum of that Day’s Adjustments), so that concurrent adds from two devices merge correctly.
11. As a signed-in user, I want Settings to stay on this device only, so that each device can keep its own targets and button amounts.
12. As a signed-in user, I want to send a Follow Request by typing another user’s username exactly, so that I can ask to see their level.
13. As a user, I want Follow Requests to myself rejected, so that I cannot Follow myself.
14. As a user with an active Follow or outgoing pending Follow Request, I want new Follow Requests blocked, so that I only ever have one Follow slot in MVP.
15. As a requester, I want to cancel a pending Follow Request and request again immediately, so that I can change my mind without waiting.
16. As a requester who was Rejected, I want to wait a full 24 hours before requesting that person again, so that Reject is meaningful without being permanent.
17. As a recipient, I want incoming Follow Requests delivered via the ~30 second poll and shown one Accept/Reject modal at a time, so that I can consent without push notifications.
18. As a recipient, I want Rejecting one Request to show the next pending modal, so that I can clear a queue.
19. As a recipient, I want Accepting one Request not to Reject the others, so that many people can Follow me.
20. As a follower after Accept, I want the followed user’s marker on my Vessel for the selected Day, so that I can compare levels.
21. As a follower viewing a past Day, I want the marker to show that user’s Daily Total for the same calendar date string, so that history lines up by date label across timezones.
22. As a follower, I want the marker placed in absolute millilitres on my Maximum Target scale, clamped at my Vessel top, so that it reads on my Vessel.
23. As a follower, I want the true millilitre amount under the marker when their Daily Total is at or above my Maximum Target, so that clamp does not hide overshoot.
24. As a follower, I want the label `username @ time` (their latest Adjustment time in my local timezone) above an inverted triangle left of centre inside the Vessel, so that I know whose level it is and when it last changed.
25. As a follower, I want the marker hidden when their Daily Total for that Day is missing or 0, so that empty Days stay clean.
26. As a follower, I want their marker refreshed about every 30 seconds while my app is open, so that I see updates without manual refresh.
27. As a follower, I want only their Daily Total and latest Adjustment time per Day (not raw Adjustments), so that their change log stays private.
28. As a follower, I want a Following control in Settings to Unfollow or cancel a pending Request, so that I can free my Follow slot.
29. As a followed user, I want a list in Settings of people who Follow me and the ability to revoke any of them, so that I control who sees my levels.
30. As a revoked or Unfollowed user, I want a new Follow Request required to Follow again, so that consent stays explicit.
31. As a user without an accepted Follow to someone, I want their published totals unreadable, so that username alone is not enough to spy.
32. As a user who forgot their password, I accept that reset is unavailable in MVP, so that we avoid email recovery.
33. As a user, I accept that Account deletion is unavailable in MVP, so that scope stays small.
34. As a future user, I want the design to allow more than one Follow marker later, so that MVP’s one-marker limit is UI-only.

## Implementation Decisions

- Stack remains React + Vite + TypeScript + Tailwind; add Supabase for Auth and Postgres ([ADR 0002](../../docs/adr/0002-supabase-for-accounts-and-sync.md)).
- Users enter username + password only; Auth uses a synthetic email derived from the username.
- Sync signed Adjustments; Daily Total = max(0, sum of Adjustments) for display ([ADR 0003](../../docs/adr/0003-sync-adjustments-expose-daily-totals.md)). UI never shows the Adjustment list.
- Small / Large / Custom Add create positive Adjustments; Custom Remove creates a negative Adjustment. Display floor is on the summed Daily Total, not by clamping each Remove at apply time across devices.
- Anonymous mode keeps working on local persistence only. After Account creation, only new Adjustments sync (no backfill of anonymous history).
- On sign-in, remote wins over anonymous local data for overlapping date strings. On sign-out, keep local numbers as anonymous data; drop Account session and Follow marker.
- Settings remain device-local and are not synced.
- Followers read a projection per Day (Daily Total + latest Adjustment timestamp), enforced so only accepted Followers can read.
- Poll ~30s while signed in and app open: own Adjustments, Follow Request inbox, and followed user’s Day projection.
- Account, Following control, followers list, and Follow-by-username live on the Settings screen.
- Follow Request Accept/Reject uses a modal (one at a time). No push notifications.
- Test seams (agreed):
  1. **domain** — Daily Total from Adjustments; Follow marker visibility, clamp, overshoot amount; existing fireworks/Day helpers.
  2. **local persistence** — Adjustments storage, Settings, outbound sync queue when signed in offline.
  3. **remote façade** — Account, Adjustment sync, Follow / Follow Request lifecycle, follower projections, polling; Supabase behind the interface.

## Testing Decisions

- Test external behaviour through the seams above, not Supabase client internals or React component plumbing.
- Prefer pure **domain** tests (extend existing `domain` Vitest style: Daily Total, fireworks, Vessel helpers).
- Local persistence tests should mirror existing storage tests (injectable `Storage` / fakes).
- Remote façade tests use a fake backend implementing the same interface (Follow Request rules, 24h Reject cooldown, projection visibility, remote-wins on sign-in).
- Do not assert on Adjustment list UI (there is none) or pixel-perfect Vessel layout beyond domain placement rules.

## Out of Scope

- Password reset / email recovery
- Account deletion
- Push notifications
- Multiple Follow markers / following more than one person at a time
- Syncing Settings across devices
- Uploading anonymous history on Account creation
- Units other than millilitres
- Reminders / notifications unrelated to Follow Request modals
- Visible drink / Adjustment history for the user

## Further Notes

- Product behaviour should also land in the root [spec.md](../../spec.md); this file is the agent-ready PRD for the feature.
- `gh` was unavailable in the environment that published this; status is recorded here as `ready-for-agent` for the local markdown tracker.
