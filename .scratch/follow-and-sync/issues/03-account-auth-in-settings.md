# 03 — Account signup / sign-in / sign-out in Settings

**What to build:** From Settings, a user can create an **Account** (username + password), sign in, and sign out. Without an Account, the app stays anonymous and local-only. No water sync required yet.

**Blocked by:** 01 — Supabase project setup

**Status:** ready-for-agent

- [ ] Client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only — not secret)
- [ ] Sign up with username + password from Settings (Auth uses synthetic email under the hood; see ticket 01 notes)
- [ ] Usernames are globally unique, fixed after signup, case-sensitive
- [ ] Sign in and sign out work; sign-out returns the device to anonymous local mode
- [ ] Anonymous use still works with no Account
- [ ] Password reset and Account deletion remain unavailable (out of scope)
- [ ] Any new profile/username table has **RLS enabled** with policies before it holds real data (RLS not set up in ticket 01)
- [ ] Remote façade (or equivalent seam) is faked in tests for Account behaviour — not Supabase client internals
