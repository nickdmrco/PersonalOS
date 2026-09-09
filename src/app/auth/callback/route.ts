import { isAllowed } from "@/lib/allowlist";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// `next` survives a round trip through the provider, so treat it as untrusted:
// only a single-slash absolute path is guaranteed to stay on this origin.
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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Every sign-in method lands here, so this is the one place that can
      // close the door on all of them at once. The session already exists by
      // now — the exchange is what creates it — so an address that isn't
      // allowed has to be signed back out rather than merely redirected.
      if (!isAllowed(data.user?.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_invited`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
