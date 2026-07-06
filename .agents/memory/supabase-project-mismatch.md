---
name: RentSVB Supabase schema sync
description: RentSVB's Supabase DB must stay in sync with the app's .from() table usage; how DDL is applied given a non-technical mobile user.
---

# RentSVB Supabase schema sync

Project ref: `rvdfhdkiofwtwgekaerz` (URL `https://rvdfhdkiofwtwgekaerz.supabase.co`). A valid anon
key is stored in the `EXPO_PUBLIC_SUPABASE_ANON_KEY` secret. Older keys/data referenced a different
project (`zuckvvqtmmfhbjxdnpvz`) — ignore that one.

## Durable lesson
The live DB schema had drifted from the app code (an old 3-table design vs. the app's richer design).
Whenever you touch DB code, cross-check `artifacts/rentsvb/supabase_setup.sql` against **every**
`supabase.from("<table>")` call in `app/` — the app uses **5 tables**: `profiles`, `properties`,
`owner_requests`, `rentals`, `settings`. `supabase_setup.sql` is the source of truth and must define
all of them plus the `property-images` storage bucket and RLS (all `for all using(true)`).

**Why:** empty listings / failed inserts were caused by missing columns/tables, not a bad key. A
correct key against a stale schema still fails.

## How to apply DDL (no computer, non-technical user)
The anon key cannot run DDL. Do **not** ask for the Postgres connection string — it needs the DB
password the user doesn't have. Instead: give the user the full SQL block to paste into
Supabase Dashboard → SQL Editor → Run (works on mobile, no password). `supabase_setup.sql` is
written to drop+recreate all tables idempotently.

## Verify without the app
Run node fetch probes against the REST endpoint from inside `artifacts/rentsvb` (key is in env).
Confirm: each table returns HTTP 200; `profiles` has full_name/telegram_id/is_blocked; the admin
row exists (`role=admin`, real UUID, `telegram_id` matching `ADMIN_TELEGRAM_ID` in
`lib/telegram.ts`); a test insert+owner-join read on `properties` succeeds. After a key change,
restart the `artifacts/rentsvb: expo` workflow so Metro re-inlines `EXPO_PUBLIC_*`.

**Why the admin needs a real profile row:** `AuthContext.loadProfile` looks up the profile by
telegram_id; without a matching row the admin falls back to an in-memory id and cannot insert
listings (owner_id FK). The row must exist with a real UUID.
