/**
 * Who is allowed to hold an account, from ALLOWED_EMAILS — a comma-separated
 * list, server-only (no NEXT_PUBLIC_ prefix, so it never ships to the browser).
 *
 * `shouldCreateUser: false` closes the email link, but a provider has no
 * equivalent: enabling Google would otherwise let any Google account that
 * reaches the consent screen create one here. This is checked in
 * /auth/callback, which every method comes back through, so it closes both.
 *
 * Unset means no restriction beyond what each method enforces for itself.
 * That is the right default for a fresh clone, and the wrong one for a
 * deployment with a provider enabled — SETUP.md says so at the point where
 * you would turn one on.
 */
export function isAllowed(email: string | null | undefined): boolean {
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return true;
  return Boolean(email && allowed.includes(email.toLowerCase()));
}
