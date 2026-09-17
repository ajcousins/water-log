# 01 — Presets replace Small/Large end-to-end

**What to build:** Settings stores an ordered list of **Presets** instead of fixed Small/Large fields. Fresh installs get the two default Presets (“Small” 150 ml, “Large” 400 ml). Existing devices migrate legacy `small`/`large` amounts into those two Presets. The main screen’s one-tap buttons come from that list (labels + amounts). Settings lets the user edit each Preset’s label and amount (still two by default). Custom is unchanged.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Settings type / defaults use an ordered Preset list (label + amount), not `small`/`large` fields
- [x] Loading legacy Settings with `small`/`large` and no `presets` migrates to two Presets and persists the new shape
- [x] Main screen shows one fill button per Preset (label + ml) that records a positive Adjustment
- [x] Settings screen edits each Preset’s label and amount; save still requires Minimum Target < Maximum Target and whole ml > 0 for amounts
- [x] Domain and local persistence tests cover defaults, validation of targets, and migration behaviour
