# 01 — Supabase project setup

**What to build:** A Supabase project the app can talk to — Auth ready for username/password via synthetic email, and credentials the client can use. No app feature work in this ticket.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Supabase project created for Water Log
- [x] Auth enabled (email/password); Confirm email off (`mailer_autoconfirm: true`) so synthetic emails work without a real inbox
- [x] Project URL and **publishable** key in local `.env` (not committed); placeholders in `.env.example` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] Setup notes recorded below for later tickets

## Notes for agents

- **API keys:** Use the **publishable** key (`sb_publishable_…`), not the legacy `anon` JWT and never the **secret** / `service_role` key in the Vite client. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **RLS:** Not enabled yet — there are no app tables. Tickets **04**, **05**, and **06** must enable RLS and policies when they create tables (Adjustments, Follow / Follow Request, projections). Do not ship readable tables with only the publishable key and no RLS.
- **Synthetic email pattern (for ticket 03):** `{username}@users.water-log.invalid` (or document the chosen pattern if different).
- **Site URL / redirects:** Prefer Management API if the dashboard fails with `Failed to fetch (api.supabase.com)`: `site_url` = `http://localhost:5173`, `uri_allow_list` including that origin; Confirm email via `mailer_autoconfirm: true`.
- **Secret keys / DB password:** Stay out of the frontend and out of git.

## Comments

- Dashboard saves for Auth URL / Confirm email may fail with `Failed to fetch (api.supabase.com)`; Management API PATCH `/v1/projects/{ref}/config/auth` is the workaround.
- Confirmed via GET config: `mailer_autoconfirm: true` (2026-08-09).
