# Sync Adjustments, expose Daily Totals

Multi-device adds would lose data under last-write-wins on a single Daily Total, and summing concurrent totals double-counts. We sync signed Adjustments and define Daily Total as max(0, sum of that Day’s Adjustments). The UI still shows only the Daily Total. Followers are given a projection (Daily Total + latest Adjustment time per Day), not the raw Adjustment log.
