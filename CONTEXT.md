# Water Log

Tracks a single user’s water intake by local calendar day, against global daily targets.

## Language

**Day**:
A local calendar date on the user’s device (midnight-to-midnight in the device timezone).
_Avoid_: session, period, UTC day

**Daily Total**:
The running amount of water recorded for one Day, in whole millilitres. One number per Day, not a list of individual drinks.
_Avoid_: intake log, sip, entry, event, history of adds

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
