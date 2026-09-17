# Presets replace Small / Large in Settings

Settings used to store two fixed fields (`small`, `large`). Users now own an ordered list of **Presets** (label + amount), so the persisted Settings shape is targets plus that list — not hard-coded Small/Large keys.

Keeping dual fields beside a growing list would split one concept across two representations and make “editable labels / add more” awkward. On load, legacy `small`/`large` migrate once into two Presets (labels “Small” / “Large”, amounts preserved); if a `presets` list is already present it wins. Settings remain device-local and unsynced (unchanged from prior ADRs).

**Considered Options**: keep `small`/`large` plus an extras list; replace with a single ordered `presets` list and migrate on read (chosen).
