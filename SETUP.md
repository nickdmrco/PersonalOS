# Dead Reckoning — setup

Milestone 1: **thin slice, deployed.** Auth + tasks only, but end to end —
Supabase behind it, running on Vercel. Everything else comes after the pipe
is proven.

Multi-tenant from commit one: every table carries `user_id` and is guarded by
Row Level Security. There is no admin bypass path to user data.

---

## 1. Finish the install (run this natively, in PowerShell)

The dependency install was started from the Linux bridge and is glacial there —
npm's thousands of small writes onto NTFS through a mount. Run it natively
instead; it takes about thirty seconds.

```powershell
cd ~\Projects\dead-reckoning
npm install @supabase/supabase-js @supabase/ssr
```

That also repairs `package.json`, which the interrupted run left without the
two Supabase entries.

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

## 3. Run the migration

Supabase dashboard -> SQL Editor -> New query. Paste the whole contents of
`supabase/migrations/0001_init.sql` and run it.

It creates all eight tables — the full data model, not just tasks — plus
indexes, the new-user trigger, and an owner-only RLS policy on every table.
Building only the tasks UI now doesn't mean rewriting the schema later.

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
  middleware.ts              session refresh + route guard
  lib/supabase/client.ts     browser client
  lib/supabase/server.ts     server client (cookie-backed)
  app/
    layout.tsx               fonts, metadata
    globals.css              design tokens, light + dark
    page.tsx                 the slice: open tasks, completed-last-7-days, undo
    actions.ts               server actions (add / toggle / delete / sign out)
    login/page.tsx           magic-link sign in, no passwords
    auth/callback/route.ts   code -> session exchange
supabase/migrations/
  0001_init.sql              full schema + RLS
```

## Verifying RLS actually works

Worth doing once, before you trust it with real entries. Sign up a second
account, add a task there, then sign in as the first account and confirm that
task is invisible — not filtered in the UI, but absent from the query. If you
ever see another account's row, stop and fix the policy before writing anything
else on top of it.

## Next

- Deploy to Vercel, add the env vars there, add the Vercel URL to Supabase's
  redirect list. Confirm login works in production before building further.
- Then port the rest: inbox, goals, dreams, journal, rules, weekly review.
- Then the export the artifact version never got.
