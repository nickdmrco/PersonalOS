"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// The callback route hands back a short code rather than the provider's own
// text, so nothing Google writes is rendered here. Anything unrecognised
// falls through to FALLBACK.
const NO_ACCOUNT =
  "There is no account for that address. This is a one-person system — sign-ups are closed.";

const MESSAGES: Record<string, string> = {
  link_invalid: "That sign-in link has expired or was already used. Ask for a new one.",
  not_invited: NO_ACCOUNT,
  access_denied: "Google sign-in was cancelled.",
  server_error: "Google couldn't finish the sign-in. Try again in a moment.",
  temporarily_unavailable: "Google sign-in is unavailable right now. Try again in a moment.",
};

/**
 * Supabase error codes worth a sentence of our own. `otp_disabled` is what
 * `shouldCreateUser: false` returns for an address with no account, so it is
 * the one you hit by mistyping your own email — the raw message ("Signups not
 * allowed for otp") reads like a fault in the app rather than a typo.
 */
const AUTH_MESSAGES: Record<string, string> = {
  otp_disabled: NO_ACCOUNT,
  signup_disabled: NO_ACCOUNT,
  user_not_found: NO_ACCOUNT,
  invalid_credentials: "That email and password don't match.",
  email_not_confirmed: "Confirm your address first — check for the link.",
  over_email_send_rate_limit:
    "Too many sign-in emails just now. Wait a few minutes and try again.",
  over_request_rate_limit:
    "Too many attempts just now. Wait a few minutes and try again.",
};

/** Falls back to Supabase's own text, which is better than nothing when the
 *  code is one we haven't given a sentence to. */
function explain(error: { code?: string; message: string }) {
  return (error.code && AUTH_MESSAGES[error.code]) || error.message;
}

const FALLBACK = "That sign-in didn't go through. Try again.";

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? (MESSAGES[initialError] ?? FALLBACK) : null,
  );

  async function onGoogle() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    // On success the browser is already leaving for Google, so `busy` stays
    // set — clearing it would flash the form back to life mid-navigation.
    if (error) {
      setBusy(false);
      setError(error.message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (usePassword) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setBusy(false);
      if (error) {
        setError(explain(error));
      } else {
        // refresh() so the server re-renders with the cookies just written.
        router.push("/");
        router.refresh();
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Without this the link doubles as a sign-up form: anyone who finds
        // the URL gets an account. There is one person here.
        shouldCreateUser: false,
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) setError(explain(error));
    else setSent(true);
  }

  if (sent) {
    return (
      <div
        className="mt-8 rounded-lg p-4 text-sm"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          color: "var(--ink-2)",
        }}
      >
        <b style={{ color: "var(--ink)" }}>Check your email.</b> A sign-in link
        is on its way to {email}. It expires in an hour.
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line-2)",
          color: "var(--ink)",
        }}
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        <span className="label">or</span>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-md px-3 py-2 text-sm"
          style={{
            background: "var(--ground)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
        {usePassword && (
          <>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-3 py-2 text-sm"
              style={{
                background: "var(--ground)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
              }}
            />
          </>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          {busy
            ? usePassword
              ? "Signing in…"
              : "Sending…"
            : usePassword
              ? "Sign in"
              : "Send sign-in link"}
        </button>
        <button
          type="button"
          onClick={() => {
            setUsePassword((v) => !v);
            setError(null);
          }}
          className="self-start text-xs underline underline-offset-4"
          style={{ color: "var(--ink-3)" }}
        >
          {usePassword
            ? "Use a one-time email link instead"
            : "Use a password instead"}
        </button>
      </form>

      {error && (
        <p className="text-xs" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
