"use client";

import { useEffect } from "react";

/**
 * Every server action throws on a database error, and without a boundary that
 * surfaced as the framework's own crash page: no message, no way back but the
 * browser's back button. This keeps the failure inside the app and offers the
 * one thing that usually works, which is doing it again.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <div className="top">
        <div>
          <h2>That didn&rsquo;t save</h2>
          <div className="meta">Nothing was lost — the write simply didn&rsquo;t land</div>
        </div>
      </div>

      <section className="panel">
        <div className="body">
          <p style={{ marginTop: 0, maxWidth: "62ch" }}>
            Most often this is the database being briefly unreachable. Trying
            again is usually enough.
          </p>

          {error.message && (
            <p
              className="num"
              style={{ color: "var(--ink-3)", maxWidth: "62ch", wordBreak: "break-word" }}
            >
              {error.message}
              {error.digest ? ` · ${error.digest}` : ""}
            </p>
          )}

          <div className="rowline" style={{ marginTop: 12 }}>
            <button className="btn pri" type="button" onClick={() => retry()}>
              Try again
            </button>
            {/* A plain anchor on purpose: this is the escape hatch from a
                segment that has already failed to render, and a full document
                load is likelier to recover than a client-side navigation out
                of broken router state. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="btn" href="/">
              Back to Today
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
