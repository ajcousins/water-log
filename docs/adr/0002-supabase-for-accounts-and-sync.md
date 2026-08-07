# Supabase for accounts and sync

Follow, Account auth, and Adjustment sync need a shared remote store. We chose Supabase (Auth + Postgres + client access with policies) over a custom API or Firebase so a static Vite app can ship username/password, Follow permissions, and 30s polling without owning server infrastructure. Users sign up with username and password only; Auth uses a synthetic email derived from the username under the hood because Supabase Auth is email-based. Custom Node + Postgres remains the fallback if Supabase constraints become painful.
