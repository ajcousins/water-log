# Water Log

Tracks a user’s water intake by local calendar day, against global daily targets, with an optional one-way Follow so another user’s level can appear on the Vessel.

## Language

**Day**:
A local calendar date on the user’s device (midnight-to-midnight in the device timezone).
_Avoid_: session, period, UTC day

**Daily Total**:
The displayed amount of water for one Day, in whole millilitres — max(0, sum of that Day’s Adjustments). Shown as one number, never as a list of drinks.
_Avoid_: intake log, sip, entry, history of adds (as something the user browses)

**Adjustment**:
A signed whole-millilitre change recorded against a Day (from Small, Large, or Custom Add/Remove). Adjustments are the unit that syncs across devices and merges by accumulation; they are not shown in the UI. When signed in but offline, the Vessel updates from the local Adjustment immediately and the sync is queued until the device is back online.
_Avoid_: drink, sip, entry, event, delta (as user-facing language)

**Settings**:
The user’s global preferences: Minimum Target, Maximum Target, Small amount, and Large amount. One set applies to every Day.
_Avoid_: profile, preferences snapshot, per-day config

**Minimum Target**:
The lower daily goal amount in whole millilitres. Reaching or passing it (via an increase) is the celebration threshold.
_Avoid_: goal (alone), min goal, soft target

**Maximum Target**:
The upper daily goal amount in whole millilitres. It defines the top of the Vessel; totals may still exceed it.
_Avoid_: cap, limit, hard maximum, max goal

**Vessel**:
The on-screen vertical representation of the Daily Total from empty (0) up to the Maximum Target.
_Avoid_: progress bar, glass, gauge, chart

**Small**:
A configured whole-millilitre amount that increases the Daily Total in one tap.
_Avoid_: sip size, quick add (alone)

**Large**:
A configured whole-millilitre amount that increases the Daily Total in one tap, larger than Small.
_Avoid_: big sip, quick add (alone)

**Custom**:
An adjustment where the user enters a whole-millilitre amount and chooses to Add or Remove it from the Daily Total.
_Avoid_: manual entry, edit total, subtract button (as a separate control)

**Follow**:
A one-way relationship: after the followed user consents, the follower may show that user’s water level beside their Vessel. The reverse is a separate Follow, not automatic. A user cannot Follow themselves. Many users may Follow the same person; a user may have at most one active Follow at a time (MVP). To Follow someone else they must Unfollow the current person first; while an active Follow or an outgoing pending Follow Request exists they cannot send a new Follow Request. The follower may Unfollow at any time (via a Following control that shows the active Follow or outgoing pending Follow Request); the followed user may revoke the Follow at any time from a list of users who Follow them. After a revoke, a new Follow Request is required to Follow again. The shown level is that user’s Daily Total for the selected Day, matched by calendar date string (e.g. `2026-08-06`) — each user’s own local Day with that label — not a shared timezone window. Followers receive only that Daily Total and the time of the latest Adjustment for the Day — not the followed user’s raw Adjustment list. While the follower’s app is open, the followed user’s level is refreshed about every 30 seconds.
_Avoid_: buddy, friend, pair, mutual follow (as the default)

**Follow Vessel**:
A second, much thinner Vessel (about 10% of the viewer’s Vessel width) shown to the left of the viewer’s Vessel when the viewer has an accepted Follow. Same height and the same Maximum Target scale as the viewer’s Vessel (absolute millilitres). Fill clamps at the viewer’s Maximum Target. No Min / Maximum / 200 ml marks on the Follow Vessel — shell and fill only. When the followed user’s Daily Total is 0 or there is no record for that Day, the Follow Vessel is still shown but empty. When their Daily Total exceeds the viewer’s Maximum Target, the true amount is centred directly above the Follow Vessel; that amount is hidden otherwise. The followed user’s username is centred directly beneath it. Their latest Adjustment time for that Day is shown to the left of the Follow Vessel at the water line when there is a last update (mirror of the viewer’s last-updated stamp on the right); omitted when empty/no update. Fill uses the same smooth height animation as the viewer’s Vessel when the level changes.
_Avoid_: Follow marker, triangle marker, buddy bar

**Follow Request**:
A pending ask from one user to Follow another. The recipient must Accept or Reject; the Follow (and Follow Vessel) exists only after Accept. The requester may cancel a pending Follow Request and may then send a new Follow Request immediately (cancel does not start the 24-hour wait). After a Reject, the requester may send another Follow Request only once a full 24 hours have passed since that Reject. Incoming Follow Requests are delivered via the same ~30 second poll as other remote data; pending requests are presented one Accept/Reject modal at a time. After Accept or Reject, the next pending Follow Request modal is shown, if any. Accepting one does not Reject the others.
_Avoid_: follow invite, friend request, share request, push notification (as required for MVP)

**Account**:
A username and password identity used for Follow and for syncing the user’s Adjustments (and thus Daily Totals) across devices. Usernames are globally unique, fixed after signup, and matched exactly (case-sensitive) when sending a Follow Request. Password reset and Account deletion are out of scope for MVP (username and password only; no email recovery). Optional: the app still works anonymously with local-only data when the user has no Account. Creating an Account does not upload prior anonymous history; only Adjustments made after the Account exists sync remotely. On sign-in, remote data replaces any anonymous local Daily Totals/Adjustments for overlapping date strings (remote wins). Settings stay on the device and are not synced. A user’s published Daily Totals are readable only by users with an accepted Follow — not by username alone. While signed in and the app is open, the device pulls remote Adjustments about every 30 seconds. Signing out returns the device to anonymous local mode (no Account session, no Follow Vessel); local Adjustments/Daily Totals already on the device are kept and become anonymous local data (no longer syncing).
_Avoid_: profile, login (as the identity itself), user record, cloud backup (as a general backup of everything)
