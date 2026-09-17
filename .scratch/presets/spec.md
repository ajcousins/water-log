# Presets — Spec

Status: ready-for-agent

## Problem Statement

The user can only one-tap Add with two fixed sizes labeled Small and Large. They cannot rename those buttons, add more sizes they actually drink, or browse extras when more than three fill controls would overflow a single row.

## Solution

Settings holds an ordered list of **Presets** (editable label + amount). Defaults are still “Small” / “Large” with today’s millilitre defaults. The user may add more (up to 8), delete down to one, and reorder. The main screen shows every Preset as a one-tap positive Adjustment, then **Custom** as the right-most control in the same horizontally scrollable row (strip starts at the left).

## User Stories

1. As a user, I want default Presets labeled Small and Large with the familiar amounts, so that the app still feels familiar on first use.
2. As a user, I want to rename a Preset’s label in Settings, so that the main-screen button matches how I think about that drink size.
3. As a user, I want to change a Preset’s millilitre amount in Settings, so that one tap adds the volume I actually drink.
4. As a user, I want to add a new Preset in Settings, so that I can one-tap sizes beyond the two defaults.
5. As a user, I want a newly added Preset to start with a usable label and amount, so that I can save without filling a blank form.
6. As a user, I want Preset labels to be unique and non-empty (max 18 characters), so that buttons stay distinguishable and readable.
7. As a user, I want Preset amounts to be whole millilitres greater than 0, so that taps always add a real volume.
8. As a user, I want two Presets to be allowed the same millilitre amount under different labels, so that I can name the same volume in different contexts.
9. As a user, I want to delete a Preset I no longer use, so that the fill row stays tidy.
10. As a user, I want delete disabled when only one Preset remains, so that I always have at least one one-tap Add.
11. As a user, I want add disabled when I already have 8 Presets, so that the list stays within the product cap.
12. As a user, I want to reorder Presets in Settings (up/down), so that my most-used sizes appear first on the main screen.
13. As a user, I want main-screen Preset buttons to follow Settings order, so that editing order has an immediate effect.
14. As a user, I want tapping a Preset to record only a positive Adjustment, so that Remove stays a deliberate Custom action.
15. As a user, I want Custom to remain available for Add and Remove of an arbitrary amount, so that Presets do not replace free-form adjust.
16. As a user, I want Custom to sit as the right-most control in the same row as Presets, so that all fill actions live in one strip.
17. As a user with many Presets, I want to scroll that row horizontally, so that every Preset and Custom remain reachable.
18. As a user, I want the fill strip to start scrolled to the left, so that my first Presets are visible immediately.
19. As a returning user with legacy Small/Large Settings, I want my amounts migrated into Presets, so that I do not lose my configured sizes.
20. As a user, I want invalid Preset or target Settings to block save with an error, so that I cannot persist a broken configuration.
21. As a user on a past Day, I want Preset taps to adjust that Day the same as today, so that history editing stays consistent.
22. As a user, I want Settings (including Presets) to stay on this device only, so that Presets behave like other Settings and do not sync.

## Implementation Decisions

- Persist Settings as Minimum Target, Maximum Target, and an ordered `presets` list (`label` + `amount`). See [ADR 0004](../../docs/adr/0004-presets-replace-small-large.md).
- Default Presets: `{ label: "Small", amount: 150 }`, `{ label: "Large", amount: 400 }`.
- New Preset seed: label `"Preset"` or `"Preset N"` for uniqueness; amount `200`.
- Validation on save: Minimum Target < Maximum Target; 1–8 Presets; each label unique (case-sensitive), trimmed non-empty, ≤18 characters; each amount a whole millilitre > 0.
- Legacy load: if `presets` absent but `small`/`large` present, migrate to two Presets with those amounts and labels “Small”/“Large”, then persist the new shape; if `presets` present, it wins; corrupt/missing → defaults.
- Main fill row: Presets in order, then Custom last; single horizontally scrollable strip; initial scroll offset left.
- At 8 Presets, disable add (with a short hint); at 1 Preset, disable delete.
- Reorder via up/down controls in Settings (no drag-and-drop required for MVP).
- Long labels may truncate with ellipsis on the circular main-screen button; Settings enforces the 18-character max.
- Settings remain device-local and unsynced.
- Domain vocabulary: [CONTEXT.md](../../CONTEXT.md).

## Testing Decisions

- Test external behaviour through existing seams only — no new seams:
  1. **domain** — Settings shape, defaults, `validateSettings` (targets + Preset rules).
  2. **local persistence** — load/save Settings; legacy `small`/`large` → Presets migration.
- Prefer pure domain Vitest tests (extend existing domain test style).
- Persistence tests inject `Storage` / fakes like existing storage tests.
- Do not assert on React layout pixels or scroll physics beyond domain/persistence behaviour; scroll strip and Settings editor are verified manually against acceptance criteria.

## Out of Scope

- Syncing Presets / Settings across devices
- Negative / Remove Presets
- Drag-and-drop reorder
- More than 8 Presets
- Labels longer than 18 characters
- Changing Custom into a Preset
- Units other than millilitres

## Further Notes

- Product behaviour should also land in the root [spec.md](../../spec.md); this file is the agent-ready PRD for the feature.
- Tickets: [.scratch/presets/issues/](./issues/).
