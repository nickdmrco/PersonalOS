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

## 5. Enable Google sign-in

Two consoles, in this order. Google needs to know Supabase; Supabase needs to
know Google. The app itself needs no new environment variables — the client
secret lives in Supabase and never reaches the browser.

### 5a. Create the Google OAuth client

1. console.cloud.google.com -> create a project (or pick one).
2. APIs & Services -> OAuth consent screen. Pick **External** unless you have
   a Workspace org. Fill in app name, support email, developer email. You can
   leave it in **Testing** — then only accounts you list under *Test users*
   can sign in, which is a decent stand-in for the single-user question below.
   Publishing to Production opens it to any Google account.
3. Scopes: the defaults are enough. Supabase asks for `email`, `profile` and
   `openid`; none of them are sensitive, so there is no verification review.
4. Credentials -> Create credentials -> **OAuth client ID** -> Web application.
5. Under *Authorised redirect URIs* add exactly one entry — Supabase's
   callback, not this app's:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   `<project-ref>` is the subdomain of the Project URL from step 2. Get this
   wrong and Google refuses with `redirect_uri_mismatch` before Supabase is
   ever reached. *Authorised JavaScript origins* can stay empty: the exchange
   happens server-side, between Supabase and Google.
6. Copy the **Client ID** and **Client secret**.

### 5b. Hand them to Supabase

Supabase dashboard -> Authentication -> Providers -> Google:

- Enable it, paste the client ID and secret, save.
- Leave *Skip nonce check* off.

Then check Authentication -> URL Configuration again (step 4). The
`redirectTo` this app sends is `<origin>/auth/callback`, and Supabase refuses
any redirect target not on that list — so localhost and the Vercel URL both
need to be there before Google works in either place.

### How the round trip actually goes

`signInWithOAuth` never signs anyone in by itself; it just hands the browser
to Google. The session is created on the way back:

```
/login  ->  Google consent  ->  <project-ref>.supabase.co/auth/v1/callback
        ->  /auth/callback?code=...  ->  exchangeCodeForSession  ->  /
```

That last hop is the same route the magic link has always used. It is PKCE
both times, and `createBrowserClient` keeps the code verifier in a cookie
rather than localStorage, which is the reason a *server* route can complete
an exchange the *browser* started. If you ever swap that for the plain
`supabase-js` client, Google sign-in breaks here and nowhere else.

A refused consent comes back with `?error=access_denied` and no code at all,
so `/auth/callback` checks for that before it looks for a code, and `/login`
maps the code to a sentence. Google's own error text is never rendered.

> **Note.** Enabling Google means any Google account that reaches the consent
> screen can sign in here. `shouldCreateUser: false` only governs the email
> link — there is no OAuth equivalent. **Set `ALLOWED_EMAILS` before you turn
> Google on** (see *Who can sign in* below); belt and braces is to also leave
> the consent screen in **Testing** with yourself as the only test user.

## 6. Run it

```powershell
npm run dev
```

Open http://localhost:3000. You'll be bounced to `/login`. Either continue
with Google, or enter your email and click the link Supabase mails you.
Both land on the task list.

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
  components/                rail, sign-in form, task rows, goal cards,
                             review wizard, editors
  app/
    layout.tsx               fonts, metadata
    globals.css              design tokens, light + dark
    actions.ts               every server action
    login/page.tsx           reads ?error, renders the form
    auth/callback/route.ts   code -> session exchange, for Google and the link
    (app)/                   the signed-in shell and every view
      page.tsx               today: focus, due, rule of the day
      inbox/ log/ review/    daily and weekly
      goals/ dreams/ rules/  quarterly, yearly, standing
supabase/migrations/
  0001_init.sql              full schema + RLS
  0002_review_once_per_week.sql
```

## Who can sign in

Closed by default, on both routes:

- The email link passes `shouldCreateUser: false`, so it signs existing
  accounts in and never creates one. An unknown address gets `otp_disabled`
  back, which the login page renders as "there is no account for that
  address" rather than Supabase's "Signups not allowed for otp".
- `ALLOWED_EMAILS` — a comma-separated list, checked in `/auth/callback`,
  which every method returns through. An address that isn't on it is signed
  straight back out. Leave it empty and only the first rule applies, which is
  fine until you enable a provider and no longer fine after.

```
ALLOWED_EMAILS=you@example.com
```

Set it in `.env.local` and in Vercel (Production, Preview and Development),
as **Config**. It is deliberately not `NEXT_PUBLIC_` — it must not ship to
the browser.

To make your own first account, with sign-ups closed: Supabase dashboard ->
Authentication -> Users -> **Add user**. There is no self-serve path, which
is the point.

The login page says plainly when an address has no account. That does tell a
stranger whether a given address is registered — a fair trade here, where the
alternative is you mistyping your own address and waiting for a link that was
never sent, and where nobody can sign up regardless.

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
   both the Site URL and a redirect (`https://<host>/auth/callback`). Google
   needs no change: its one redirect URI points at Supabase, not at this app,
   so it is the same for localhost, previews and production alike.
5. Add `ALLOWED_EMAILS` (see *Who can sign in*) if a provider is enabled.
6. **Put the functions in the same region as the database.** Settings ->
   Functions -> Function Region. See below — this one is worth its own
   heading.

Vercel only builds on pushes it receives after the repo is connected, so if
the project shows "No Production Deployment", push a commit to `main`.

### Put the functions next to the database

Vercel defaults new projects to `iad1` (Washington). If the Supabase project
is anywhere else, every query on every render is a round trip across that gap
— and it is not one round trip but three or so, because each invocation opens
a fresh connection and pays the TLS handshake before the query is even sent.

Measured on this app, `/inbox`, which runs exactly one query:

| Function region | Function duration | Response |
| --- | --- | --- |
| `iad1` (Washington) | 334 ms | 490 ms |
| `pdx1` (Portland)   | 40 ms  | 124 ms |

Same commit, same query, same afternoon. Supabase is in `us-west-2` (Oregon),
which `pdx1` sits inside, so the hop went from coast-to-coast to nothing.

Match the city, not the region code: Supabase names AWS regions (`us-west-2`)
and Vercel names cities (`pdx1` = Portland). Two traps in reading this:

- The **"Received in ..."** line in a request trace is the edge that took the
  request, not where the function ran. Those are different places, and only
  the second one matters here. The trace names the function's region on its
  own line ("Routed to ...").
- A **prefetch** (`Prefetch: Yes`, or a `_rsc=` parameter with no navigation)
  never renders the page and so never queries. It will look fast whatever the
  region is. Only a real navigation measures anything.

Changing the region needs a new deployment before it takes effect.

### What is still slow, and is meant to be

- **The first request after an idle spell** pays a cold start, and with it a
  fetch of the JWKS the proxy verifies sessions against. Occasional
  half-second responses with an outgoing call from the middleware are this,
  not a regression. The loading skeleton exists so it reads as loading.
- **Roughly hourly**, an access token expires and the session refresh adds a
  round trip inside the proxy. Same shape, same non-fix.

A request logged with `Status: 0` and no "Response finished" line was
abandoned by the browser — usually a prefetch cancelled by navigating. Its
duration is time-until-abandoned, not work done, so don't read it as latency.

## Next

- Real SMTP, if you ever want mail that isn't rate-limited to a handful an
  hour. With sign-ups closed and one user, the built-in mailer may be enough
  forever.
- Then the export the artifact version never got.
