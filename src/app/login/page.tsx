"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dead Reckoning
        </h1>
        <p className="label mt-1">Position by log &amp; heading</p>

        {sent ? (
          <div
            className="mt-8 rounded-lg p-4 text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink-2)",
            }}
          >
            <b style={{ color: "var(--ink)" }}>Check your email.</b> A sign-in
            link is on its way to {email}. It expires in an hour.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
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
            <button
              type="submit"
              disabled={busy}
              className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
            <p className="text-xs" style={{ color: "var(--ink-3)" }}>
              No password. We email you a one-time link.
            </p>
            {error && (
              <p className="text-xs" style={{ color: "var(--bad)" }}>
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
