# Water Log - Specification

A simple, lightweight, mobile-first web application that helps a user track their daily water intake. Anonymous local use works on one device; an optional **Account** enables multi-device Adjustment sync and **Follow** so one other person’s level can appear on the Vessel.

Domain vocabulary lives in [CONTEXT.md](CONTEXT.md). Architectural decisions live in [docs/adr/](docs/adr/). Feature PRD: [.scratch/follow-and-sync/spec.md](.scratch/follow-and-sync/spec.md).

## Stack

- React + Vite (static page)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres) for Accounts, Adjustment sync, and Follow — see [ADR 0002](docs/adr/0002-supabase-for-accounts-and-sync.md)

## Core concepts

- A **Day** is the device’s local calendar date.
- Each Day’s **Daily Total** is max(0, sum of that Day’s **Adjustments**) in whole millilitres. Adjustments are not shown as a list; the UI shows only the Daily Total. See [ADR 0003](docs/adr/0003-sync-adjustments-expose-daily-totals.md).
- **Settings** are global on the device: **Minimum Target**, **Maximum Target**, **Small** amount, and **Large** amount. The same Settings apply when viewing any Day. Settings are not synced across devices.
- The **Vessel** is the visual representation of the Daily Total from 0 up to the Maximum Target.
- An **Account** (username + password) is optional. Without one, data stays local only.
- A **Follow** is a one-way, consented relationship: the follower may show the followed user’s level on their Vessel (at most one active Follow in MVP).

All amounts in the app are whole millilitres only (positive integers where an amount is entered; Daily Total floors at 0).

## Main screen

### Date navigation

- At the top of the page, show the selected Day’s date in the form `Thu, 30 Jul 2026`.
- A triangle arrow to the left navigates one Day backward. Back-navigation is unlimited: empty Days (no stored total) display as 0 ml until the user adds water.
- A triangle arrow to the right navigates one Day forward. It is disabled when the selected Day is today, so the user cannot navigate into the future.
- Past Days are writable: Small, Large, and Custom adjust that Day the same way as today.

### Total display

- Directly above the Vessel, show the Daily Total as a number (e.g. `1500 ml`).
- The number can exceed the Maximum Target.
- When the Daily Total **exceeds** the Maximum Target (strictly greater), the total text turns red. At or below the Maximum Target, it uses the normal colour.

### Vessel

- A vertical Vessel is shown centrally on the page.
- Water fills from the bottom in light blue, with a smooth animation as if filling a glass.
- The top of the Vessel is the Maximum Target. Visual fill clamps at the Maximum Target: adding more does not raise the fill above “full,” even if the Daily Total continues to climb.
- Mark the Minimum Target and Maximum Target on the Vessel.
- Mark progress every 200 ml between 0 and the Maximum Target.

### Follow Vessel

When the user has an accepted Follow, show a **Follow Vessel** to the left of their Vessel:

- About 10% of the viewer’s Vessel width; same height; same Maximum Target scale (absolute millilitres).
- Fill clamps at the viewer’s Maximum Target; no Min / 200 ml marks.
- Username centred beneath the Follow Vessel.
- Latest Adjustment time for that Day to the left of the Follow Vessel at the water line (mirror of the viewer’s stamp on the right); omitted when there is no update.
- Still shown when the followed Daily Total is 0 or missing (empty fill).
- When the followed Daily Total **exceeds** the viewer’s Maximum Target, show the true amount centred above the Follow Vessel; hide that amount otherwise.
- Matched by calendar date string; refresh about every 30 seconds while the app is open.
- Followers receive only Daily Total + latest Adjustment time — not raw Adjustments.

### Fill controls

Three circular buttons at the bottom of the page:

- **Small** — records a positive Adjustment of the configured Small amount for the selected Day.
- **Large** — records a positive Adjustment of the configured Large amount for the selected Day.
- **Custom** — opens the Custom adjust modal (see below).

### Settings entry

A discrete settings control in the top left opens the Settings screen.

## Custom adjust modal

Opened by the Custom button.

- The user enters a whole-millilitre amount.
- Two actions at the bottom: **Add** and **Remove**.
- **Add** records a positive Adjustment of that amount.
- **Remove** records a negative Adjustment of that amount. Daily Total is max(0, sum of Adjustments).

## Settings screen

The user can edit:

| Setting | Default |
| --- | --- |
| Minimum Target | 1500 ml |
| Maximum Target | 2500 ml |
| Small | 150 ml |
| Large | 400 ml |

Validation: saving is blocked with an error unless **Minimum Target < Maximum Target**.

Changing Settings updates the Vessel marks for every Day immediately (including past Days). Historical Daily Totals are not re-keyed or snapshotted against old targets. See [ADR 0001](docs/adr/0001-global-settings-across-days.md).

### Account and Follow (Settings)

- Sign up / sign in / sign out (username + password; Auth uses a synthetic email under the hood).
- Usernames are globally unique, fixed after signup, matched exactly (case-sensitive) for Follow Requests.
- Following control: show active Follow or outgoing pending Follow Request; Unfollow or cancel pending.
- Send Follow Request by username (blocked while an active Follow or outgoing pending Request exists; cannot Follow self).
- List of users who Follow you, with revoke.
- Incoming Follow Requests: polled ~30s; one Accept/Reject modal at a time; after Accept or Reject, show the next if any. Cancel of an outgoing Request allows immediate re-request; Reject imposes a 24-hour wait before requesting that user again.
- Many users may Follow the same person; MVP allows only one active Follow (and one Follow Vessel) per user.

## Fireworks

Fireworks fire on the page when the Daily Total **increases** from **below** the Minimum Target to **at or above** the Minimum Target (landing exactly on the Minimum Target counts).

- No fireworks when the total decreases past the Minimum Target.
- Fireworks may fire repeatedly on the same Day whenever that increase-crossing happens again (e.g. after Remove then Add).
- The same rule applies when editing a past Day.

Navigating to a Day that is already at or above the Minimum Target does not fire fireworks by itself.

## Persistence and sync

- **Anonymous:** Settings and Adjustments (Daily Totals derived) in browser local storage. Missing Days are 0 ml until water is added.
- **Signed in:** Adjustments sync via Supabase across the user’s devices; ~30s pull while the app is open. Offline: update UI immediately and queue sync. Creating an Account (or signing in) uploads prior anonymous local Adjustments and merges them with remote by Adjustment id. On sign-out, keep local numbers as anonymous; drop session and Follow Vessel.
- Published Daily Totals are readable only by users with an accepted Follow.

## Out of scope

- Password reset / email recovery
- Account deletion
- Push notifications
- Multiple Follow Vessels / following more than one person at a time
- Syncing Settings across devices
- Reminders / notifications (aside from in-app Follow Request modals)
- Units other than millilitres
- Visible Adjustment / drink history
