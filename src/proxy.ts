import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/auth"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));

  // A fresh redirect response would drop any rotated auth cookies that the
  // session refresh just wrote onto `response`, signing the user back out.
  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Absent credentials used to throw on the line below, and this runs ahead of
  // every route — so a deployment missing them answered a bare plain-text 500
  // everywhere, /login included, with nothing on screen to diagnose from. The
  // build succeeds without them, so the deploy looks green. There is no session
  // to read in that state, so guard nothing and let /login name what's missing.
  if (!supabaseUrl || !supabaseKey) {
    return path === "/login" ? response : redirectTo("/login");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Verifies the JWT locally against the project's public signing key, and
  // still refreshes the token when it is close to expiring. getUser() would
  // do the same but costs a round trip to the auth server on every request,
  // prefetches included — which is most of what navigation used to spend.
  // This is the optimistic check; requireUser() and RLS remain the real gate.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  } catch {
    // An unreachable auth server or an unreadable token means "treat them as
    // signed out", not "take the site down" — which is what raising here does,
    // on every route at once. The real data stays gated either way.
    signedIn = false;
  }

  if (!signedIn && !isPublic) return redirectTo("/login");
  if (signedIn && path === "/login") return redirectTo("/");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
