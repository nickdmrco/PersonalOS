import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/auth"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // Verifies the JWT locally against the project's public signing key, and
  // still refreshes the token when it is close to expiring. getUser() would
  // do the same but costs a round trip to the auth server on every request,
  // prefetches included — which is most of what navigation used to spend.
  // This is the optimistic check; requireUser() and RLS remain the real gate.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  // A fresh redirect response would drop any rotated auth cookies that
  // getUser() just wrote onto `response`, signing the user back out.
  function redirectTo(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));

  if (!signedIn && !isPublic) return redirectTo("/login");
  if (signedIn && path === "/login") return redirectTo("/");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
