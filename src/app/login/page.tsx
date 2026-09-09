import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Read on the server so the form doesn't need useSearchParams, which would
  // pull the whole tree out of the prerender and want a Suspense boundary.
  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dead Reckoning
        </h1>
        <p className="label mt-1">Position by log &amp; heading</p>

        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
