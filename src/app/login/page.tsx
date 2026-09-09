import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Read on the server so the form doesn't need useSearchParams, which would
  // pull the whole tree out of the prerender and want a Suspense boundary.
  const { error } = await searchParams;

  // Both are public by design and documented in SETUP.md, so naming the ones
  // that are absent gives away nothing — and it is the only thing on screen
  // when a deployment is missing them. Never print the values.
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter((v): v is string => typeof v === "string");

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dead Reckoning
        </h1>
        <p className="label mt-1">Position by log &amp; heading</p>

        {missing.length ? (
          <div
            className="mt-8 rounded-lg p-4 text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink-2)",
            }}
          >
            <b style={{ color: "var(--ink)" }}>Not configured.</b> This
            deployment is missing{" "}
            {missing.length === 1
              ? "an environment variable"
              : "two environment variables"}
            :
            <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
              {missing.map((name) => (
                <li key={name} className="num" style={{ lineHeight: 1.7 }}>
                  {name}
                </li>
              ))}
            </ul>
            Set {missing.length === 1 ? "it" : "them"} for Production, Preview
            and Development, then redeploy. Signing in cannot work until then —
            see SETUP.md.
          </div>
        ) : (
          <LoginForm initialError={error} />
        )}
      </div>
    </main>
  );
}
