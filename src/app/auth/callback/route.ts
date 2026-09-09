import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// `next` survives a round trip through Google, so treat it as untrusted: only
// a single-slash absolute path is guaranteed to stay on this origin.
function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  // A refused or failed consent comes back here with no code at all — most
  // often ?error=access_denied, when the account chooser was dismissed.
  const denied = searchParams.get("error");
  if (denied) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(denied)}`,
    );
  }

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
