# Dead Reckoning

A personal operating system organised by **cadence** rather than hierarchy.

Layers refresh at different rates, and the app is arranged fastest-first:
daily (today, inbox, log), weekly (the review), quarterly (goals), yearly
(dreams), and standing (rules). On an ordinary day only the daily layer
should be visible.

Two ideas do the real work:

- **The weekly review is the scheduler.** It is the only place a dream turns
  into something you do on Thursday. Without it the upper layers are decoration.
- **Rules are an output, not an input.** You log friction daily; rules are
  promoted from friction that repeats. A rule written before the evidence
  existed is a guess.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Vercel

Multi-tenant from the first commit: every table carries `user_id` and is
guarded by Row Level Security.

## Getting started

See [SETUP.md](./SETUP.md).
