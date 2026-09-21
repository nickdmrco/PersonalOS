-- Unsubscribe for the weekly digest.
--
-- The token is opaque rather than a signature: it needs no secret to verify,
-- it can be rotated per person by updating one row, and nothing about it
-- depends on a key that might be rotated for unrelated reasons. A v4 uuid is
-- unguessable, which is all the link has to be.
--
-- Postgres evaluates a volatile default once per existing row, so every
-- profile that already exists gets its own token from this.

alter table public.profiles
  add column if not exists digest_opt_out boolean not null default false,
  add column if not exists digest_token   uuid    not null default gen_random_uuid();

-- The unsubscribe endpoint looks a profile up by this and nothing else.
create unique index if not exists profiles_digest_token_idx
  on public.profiles (digest_token);
