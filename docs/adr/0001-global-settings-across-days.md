# Global Settings across Days

Settings (Minimum Target, Maximum Target, Small, Large) are stored once and apply to every Day the user views or edits. We do not snapshot targets per Day.

History would look more accurate if each Day remembered the targets in force when water was logged, but that doubles what we persist and complicates the Vessel when Settings change. For a single-device local app, one global Settings record is enough: past Daily Totals stay as stored millilitres, and Vessel marks always reflect the current Settings.

**Considered Options**: per-Day target snapshots; global Settings only (chosen).
