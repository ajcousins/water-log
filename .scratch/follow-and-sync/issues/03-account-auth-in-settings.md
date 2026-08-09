# 03 — Account signup / sign-in / sign-out in Settings

**What to build:** From Settings, a user can create an **Account** (username + password), sign in, and sign out. Without an Account, the app stays anonymous and local-only. No water sync required yet.

**Blocked by:** 01 — Supabase project setup

**Status:** resolved

- [x] Client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only — not secret)
- [x] Sign up with username + password from Settings (Auth uses synthetic email under the hood; see ticket 01 notes)
- [x] Usernames are globally unique, fixed after signup, case-sensitive
- [x] Sign in and sign out work; sign-out returns the device to anonymous local mode
- [x] Anonymous use still works with no Account
- [x] Password reset and Account deletion remain unavailable (out of scope)
- [x] **You:** Run `supabase/migrations/20260809_profiles.sql` in the Supabase SQL Editor (creates `profiles` with RLS)
- [x] Remote façade (or equivalent seam) is faked in tests for Account behaviour — not Supabase client internals

## Comments

- App code for Account UI + `RemoteWaterLog` façade landed. Sign up/in will fail until the profiles migration is applied.
