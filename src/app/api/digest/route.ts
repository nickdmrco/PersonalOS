import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowed } from "@/lib/allowlist";
import { buildDigest } from "@/lib/digest";
import { renderDigestEmail } from "@/lib/digest-email";
import type { Goal, JournalEntry, Review, Task } from "@/lib/types";

/** Constant-time, and false for any length mismatch rather than leaking it. */
function secretMatches(given: string | null, expected: string) {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Fail closed. An unset secret must not mean "open to anyone", because this
  // route is in the proxy's public list so the scheduler can reach it.
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  const query = request.nextUrl.searchParams.get("key");
  if (!secretMatches(bearer, secret) && !secretMatches(query, secret)) {
    return NextResponse.json({ error: "not for you" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM;
  if (!url || !serviceKey || !resendKey || !from) {
    return NextResponse.json(
      {
        error: "not configured",
        missing: [
          !url && "NEXT_PUBLIC_SUPABASE_URL",
          !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
          !resendKey && "RESEND_API_KEY",
          !from && "DIGEST_FROM",
        ].filter(Boolean),
      },
      { status: 503 },
    );
  }

  // The only place in the app that holds the service role key. It bypasses RLS
  // entirely, which is the whole reason the route is behind a secret and reads
  // nothing beyond what the digest needs.
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;

  const { data: profiles, error } = await db.from("profiles").select("id, email");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: string[] = [];
  const skipped: { email: string; why: string }[] = [];

  for (const profile of profiles ?? []) {
    const email: string | null = profile.email;
    if (!email) {
      skipped.push({ email: String(profile.id), why: "no address on the profile" });
      continue;
    }
    // Same gate as signing in: someone who could not get in should not get mail.
    if (!isAllowed(email)) {
      skipped.push({ email, why: "not on ALLOWED_EMAILS" });
      continue;
    }

    const [goals, tasks, journal, reviews] = await Promise.all([
      db.from("goals").select("*").eq("user_id", profile.id),
      db.from("tasks").select("*").eq("user_id", profile.id),
      db.from("journal_entries").select("*").eq("user_id", profile.id),
      db.from("reviews").select("*").eq("user_id", profile.id),
    ]);

    const digest = buildDigest({
      goals: (goals.data ?? []) as Goal[],
      tasks: (tasks.data ?? []) as Task[],
      journal: (journal.data ?? []) as JournalEntry[],
      reviews: (reviews.data ?? []) as Review[],
    });

    if (digest.reviewed) {
      skipped.push({ email, why: "already reviewed this week" });
      continue;
    }
    // Nothing happened and nothing is being tracked: an empty summary is just
    // a nag, and this is the shape of a brand new account.
    if (!digest.completed.length && !digest.goals.length && !digest.frictions.length) {
      skipped.push({ email, why: "nothing to report" });
      continue;
    }

    const { subject, html, text } = renderDigestEmail(digest, appUrl);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: email, subject, html, text }),
    });

    if (res.ok) {
      sent.push(email);
    } else {
      skipped.push({ email, why: `resend ${res.status}: ${(await res.text()).slice(0, 200)}` });
    }
  }

  return NextResponse.json({ sent, skipped });
}
