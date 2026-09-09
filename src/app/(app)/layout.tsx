import Link from "next/link";
import { Nav } from "@/components/Nav";
import { signOut } from "@/app/actions";
import { inboxCount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const count = await inboxCount();

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
          <span>{user?.email}</span>
          <form action={signOut}>
            <button className="btn sm gh" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="view">{children}</main>
    </div>
  );
}
