# 02 — Add, delete, and reorder Presets

**What to build:** In Settings, the user can add Presets (up to 8), delete them (down to 1), and reorder with up/down. New Presets seed as “Preset” / “Preset N” at 200 ml. Save enforces unique non-empty labels ≤20 characters, whole ml > 0 amounts, and the 1–8 count. Add is disabled at 8; delete is disabled at 1. Main-screen button order follows Settings order.

**Blocked by:** 01 — Presets replace Small/Large end-to-end

**Status:** resolved

- [x] User can add a Preset with seed label/amount; add control disabled at 8 with a short hint
- [x] User can delete a Preset; delete disabled when only one remains
- [x] User can reorder Presets with up/down; main screen reflects that order
- [x] Save blocked with an error for empty/whitespace labels, labels over 20 chars, duplicate labels (case-sensitive), non-positive/non-integer amounts, or count outside 1–8
- [x] Domain (and persistence if needed) tests cover these Preset validation and list rules
