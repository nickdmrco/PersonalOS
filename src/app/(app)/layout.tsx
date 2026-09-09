import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/app/actions";
import { inboxCount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // The email is already in the verified claims; getUser() would re-fetch it
  // from the auth server just to render it in the rail.
  const [{ data: claims }, count] = await Promise.all([
    supabase.auth.getClaims(),
    inboxCount(),
  ]);
  const email = claims?.claims.email;

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1>Dead Reckoning</h1>
          </Link>
          <span className="label">Position by log &amp; heading</span>
        </div>

        <Nav inboxCount={count} />

        <div className="rail-foot">
          <span>{email}</span>
          <form action={signOut}>
            <SubmitButton className="btn sm gh" pendingLabel="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <main className="view">{children}</main>
    </div>
  );
}
