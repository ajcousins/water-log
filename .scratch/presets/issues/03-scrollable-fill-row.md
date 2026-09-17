# 03 — Scrollable fill row with Custom last

**What to build:** On the main screen, all Preset buttons and **Custom** share one horizontally scrollable row. Custom is always the right-most control. The strip starts scrolled to the left so the first Presets are visible; the user scrolls right to reach further Presets and Custom when the row overflows.

**Blocked by:** 02 — Add, delete, and reorder Presets

**Status:** resolved

- [x] Fill controls are a single horizontal strip: Presets in Settings order, then Custom last
- [x] The strip scrolls horizontally when controls overflow the viewport
- [x] Initial scroll position is the left edge (first Presets visible)
- [x] Custom remains reachable by scrolling and still opens the Custom Add/Remove modal
- [x] With enough Presets to overflow (or a narrow viewport), scrolling reaches every Preset and Custom
