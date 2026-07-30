# Water Log - Specification

A simple, lightweight, mobile-first web application that helps a single user track their daily water intake on one device.

Domain vocabulary lives in [CONTEXT.md](CONTEXT.md). Architectural decisions live in [docs/adr/](docs/adr/).

## Stack

- React + Vite (static page)
- TypeScript
- Tailwind CSS

## Core concepts

- A **Day** is the device’s local calendar date.
- Each Day has a **Daily Total**: a single running total in whole millilitres (not a list of individual drinks).
- **Settings** are global: **Minimum Target**, **Maximum Target**, **Small** amount, and **Large** amount. The same Settings apply when viewing any Day.
- The **Vessel** is the visual representation of the Daily Total from 0 up to the Maximum Target.

All amounts in the app are whole millilitres only (positive integers where an amount is entered; totals floor at 0).

## Main screen

### Date navigation

- At the top of the page, show the selected Day’s date in the form `Thu, 30 Jul 2026`.
- A triangle arrow to the left navigates one Day backward. Back-navigation is unlimited: empty Days (no stored total) display as 0 ml until the user adds water.
- A triangle arrow to the right navigates one Day forward. It is disabled when the selected Day is today, so the user cannot navigate into the future.
- Past Days are writable: Small, Large, and Custom adjust that Day’s Daily Total the same way as today.

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

### Fill controls

Three circular buttons at the bottom of the page:

- **Small** — increases the selected Day’s Daily Total by the configured Small amount.
- **Large** — increases the selected Day’s Daily Total by the configured Large amount.
- **Custom** — opens the Custom adjust modal (see below).

### Settings entry

A discrete settings control in the top left opens the Settings screen.

## Custom adjust modal

Opened by the Custom button.

- The user enters a whole-millilitre amount.
- Two actions at the bottom: **Add** and **Remove**.
- **Add** increases the Daily Total by that amount.
- **Remove** decreases the Daily Total by that amount. If the result would be negative, the Daily Total becomes **0** (floor).

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

## Fireworks

Fireworks fire on the page when the Daily Total **increases** from **below** the Minimum Target to **at or above** the Minimum Target (landing exactly on the Minimum Target counts).

- No fireworks when the total decreases past the Minimum Target.
- Fireworks may fire repeatedly on the same Day whenever that increase-crossing happens again (e.g. after Remove then Add).
- The same rule applies when editing a past Day.

Navigating to a Day that is already at or above the Minimum Target does not fire fireworks by itself.

## Persistence

All user data is stored in the browser’s local storage:

- Settings (Minimum Target, Maximum Target, Small, Large).
- Daily Total per Day (keyed by local calendar date), so the user can navigate history and edit past intake.

Missing Days are treated as 0 ml until water is added for that date.

## Out of scope

- Accounts / multi-user
- Cloud sync / multi-device
- Reminders / notifications
- Units other than millilitres
