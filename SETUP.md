# Dead Reckoning — setup

Milestone 1: **thin slice, deployed.** Auth + tasks only, but end to end —
Supabase behind it, running on Vercel. Everything else comes after the pipe
is proven.

Multi-tenant from commit one: every table carries `user_id` and is guarded by
Row Level Security. There is no admin bypass path to user data.

---

## 1. Install (run this natively, in PowerShell)

Run npm natively rather than through the Linux bridge — thousands of small
writes onto NTFS through a mount is glacial. Natively it takes about a minute.

```powershell
cd ~\Projects\dead-reckoning
npm install
```

If a previous install was interrupted, delete `node_modules` first; a partial
tree leaves `next` without its `package.json` and `npm run dev` won't start.

## 2. Create the Supabase project

1. Go to supabase.com and create a new project. Any region near you.
2. Project Settings -> API. You need two values:
   - Project URL
   - `anon` / publishable key
3. Copy the example env file and paste them in:

```powershell
copy .env.local.example .env.local
```

Don't paste these into chat — you don't need to, and `.env.local` is already
gitignored. The `anon` key is designed to be public (it ships to the browser);
its safety comes entirely from the RLS policies in step 3, which is why those
matter more than the key does.

## 3. Run the migrations

Supabase dashboard -> SQL Editor -> New query. Run each file in
`supabase/migrations/` in order, one query at a time:

- `0001_init.sql` — all eight tables, indexes, the new-user trigger, and an
  owner-only RLS policy on every table.
- `0002_review_once_per_week.sql` — a unique constraint on
  `reviews (user_id, week_of)`. `finishReview` upserts against this
  constraint, so the weekly review errors until it exists.

Supabase's SQL editor warns that `0001` "creates tables without enabling RLS".
That is a false positive: the enabling statements are built as strings inside
a `do $$` block, which its analyser can't read. Verify for yourself with:

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;
```

Eight rows, every `rowsecurity` true.

## 4. Configure the auth redirect

Supabase dashboard -> Authentication -> URL Configuration:

- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/auth/callback`

When you deploy, add the Vercel URL to both.

## 5. Run it

```powershell
npm run dev
```

Open http://localhost:3000. You'll be bounced to `/login`. Enter your email,
click the link Supabase mails you, and you should land on the task list.

---

## What's here

```
src/
  proxy.ts                   session refresh + route guard
  lib/
    supabase/client.ts       browser client
    supabase/server.ts       server client (cookie-backed)
    data.ts                  loadAll() — the seven tables in one round trip
    model.ts                 progress, drift, rule-of-day: the app's opinions
    dates.ts                 local-day keys, quarters, week boundaries
    types.ts                 row types
  components/                rail, task rows, goal cards, review wizard, editors
  app/
    layout.tsx               fonts, metadata
    globals.css              design tokens, light + dark
    actions.ts               every server action
    login/page.tsx           magic link, with a password fallback
    auth/callback/route.ts   code -> session exchange
    (app)/                   the signed-in shell and every view
      page.tsx               today: focus, due, rule of the day
      inbox/ log/ review/    daily and weekly
      goals/ dreams/ rules/  quarterly, yearly, standing
supabase/migrations/
  0001_init.sql              full schema + RLS
  0002_review_once_per_week.sql
```

## Verifying RLS actually works

Worth doing once, before you trust it with real entries. Sign up a second
account, add a task there, then sign in as the first account and confirm that
task is invisible — not filtered in the UI, but absent from the query. If you
ever see another account's row, stop and fix the policy before writing anything
else on top of it.

## Deploying to Vercel

1. Run both migrations against the Supabase project first (step 3).
2. Import the repo at vercel.com/new. Next.js is detected automatically.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
   Settings -> Environment Variables, for Production, Preview and Development.
   Set them as **Config**, not Secret: both ship to the browser by design, and
   Secret values can't be read back afterwards. The `service_role` key is the
   one that would be a Secret — nothing here uses it, and it must never carry
   a `NEXT_PUBLIC_` prefix.
4. Add the deployed URL to Supabase -> Authentication -> URL Configuration, as
   both the Site URL and a redirect (`https://<host>/auth/callback`).

Vercel only builds on pushes it receives after the repo is connected, so if
the project shows "No Production Deployment", push a commit to `main`.

## Next

- Decide whether this is single-user or multi-tenant. `signInWithOtp` defaults
  to `shouldCreateUser: true`, so a public URL means open signup. The schema
  and RLS support either; the login page currently assumes neither.
- Replace the built-in Supabase mailer with real SMTP. The built-in one is
  rate-limited to a handful of messages an hour and is not usable in
  production.
- Then the export the artifact version never got.
