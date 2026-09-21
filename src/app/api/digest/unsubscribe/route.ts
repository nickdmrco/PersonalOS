import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { unsubscribePage } from "@/lib/unsubscribe-page";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function page(title: string, body: string, action?: { token: string; label: string; on: boolean }) {
  return new NextResponse(unsubscribePage(title, body, action), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * The link in the footer. It asks rather than acts: mail clients and security
 * scanners fetch every link in a message, so unsubscribing on GET would opt
 * people out who never clicked anything.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const on = request.nextUrl.searchParams.get("on") === "1";
  if (!token) return page("Nothing to do", "That link is missing its code.");

  const db = admin();
  if (!db) return page("Not configured", "This deployment cannot process that right now.");

  const { data } = await db
    .from("profiles")
    .select("email, digest_opt_out")
    .eq("digest_token", token)
    .maybeSingle();

  if (!data) return page("Nothing to do", "That link has expired or was already replaced.");

  if (on) {
    return page("Start the weekly email again?", "You would get one message a week, on Sunday.", {
      token,
      label: "Yes, send it again",
      on: true,
    });
  }

  return data.digest_opt_out
    ? page("Already unsubscribed", "You are not receiving the weekly email.", {
        token,
        label: "Actually, send it again",
        on: true,
      })
    : page("Stop the weekly email?", "You will keep your account and everything in it. Only the Sunday email stops.", {
        token,
        label: "Unsubscribe",
        on: false,
      });
}

/**
 * Does the work. Also what one-click unsubscribe sends: RFC 8058 has the mail
 * client POST here by itself, which is why List-Unsubscribe-Post is set on the
 * message.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token =
    (form?.get("t") as string | null) ?? request.nextUrl.searchParams.get("t");
  const on = ((form?.get("on") as string | null) ?? request.nextUrl.searchParams.get("on")) === "1";
  if (!token) return page("Nothing to do", "That link is missing its code.");

  const db = admin();
  if (!db) return page("Not configured", "This deployment cannot process that right now.");

  const { data, error } = await db
    .from("profiles")
    .update({ digest_opt_out: !on })
    .eq("digest_token", token)
    .select("email")
    .maybeSingle();

  if (error || !data) return page("Nothing to do", "That link has expired or was already replaced.");

  return on
    ? page("Back on", "The weekly email will arrive on Sunday.")
    : page("Unsubscribed", "No more weekly emails. Your account and everything in it are untouched.");
}
