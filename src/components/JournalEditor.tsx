"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { promoteFriction, saveJournal } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { dkey } from "@/lib/dates";
import type { JournalEntry } from "@/lib/types";

type Fields = { entry: string; wins: string; friction: string };
const BLANK: Fields = { entry: "", wins: "", friction: "" };

/**
 * "Today" has to be the viewer's local day, not the server's UTC day, or an
 * evening entry lands on tomorrow. So the date is resolved on the client
 * after mount, which also avoids a hydration mismatch.
 */
const subscribe = () => () => {};

export function JournalEditor({ entries }: { entries: JournalEntry[] }) {
  // null while server-rendering and hydrating, the local day thereafter.
  const date = useSyncExternalStore(
    subscribe,
    () => dkey(),
    () => null,
  );
  const [edits, setEdits] = useState<Fields | null>(null);
  const [savedFriction, setSavedFriction] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existing = date ? entries.find((e) => e.entry_date === date) : undefined;
  const fields =
    edits ??
    (existing
      ? { entry: existing.entry, wins: existing.wins, friction: existing.friction }
      : BLANK);
  const frictionOnRecord = savedFriction ?? existing?.friction ?? "";

  function change(key: keyof Fields, value: string) {
    const next = { ...fields, [key]: value };
    setEdits(next);
    setStatus("saving");

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!date) return;
      const fd = new FormData();
      fd.set("entry_date", date);
      fd.set("entry", next.entry);
      fd.set("wins", next.wins);
      fd.set("friction", next.friction);
      await saveJournal(fd);
      setSavedFriction(next.friction);
      setStatus("saved");
    }, 700);
  }

  if (!date) {
    return (
      <div className="empty">
        <strong>Loading today&rsquo;s log…</strong>
      </div>
    );
  }

  return (
    <>
      <div className="field">
        <label className="label" htmlFor="j-entry">
          What happened
        </label>
        <textarea
          id="j-entry"
          value={fields.entry}
          onChange={(e) => change("entry", e.target.value)}
          placeholder="Plain prose. No format to satisfy."
        />
      </div>

      <div className="split">
        <div className="field">
          <label className="label" htmlFor="j-wins">
            Went well
          </label>
          <textarea
            id="j-wins"
            style={{ minHeight: 58 }}
            value={fields.wins}
            onChange={(e) => change("wins", e.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="j-friction">
            Friction
          </label>
          <div className="hint">What got in the way? This is where rules come from.</div>
          <textarea
            id="j-friction"
            style={{ minHeight: 58 }}
            value={fields.friction}
            onChange={(e) => change("friction", e.target.value)}
          />
        </div>
      </div>

      <div className="rowline">
        <span className="num" style={{ color: "var(--ink-3)" }}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
        {frictionOnRecord.trim() !== "" && (
          <form action={promoteFriction}>
            <input type="hidden" name="date" value={date} />
            <SubmitButton className="btn sm" pendingLabel="Opening…">
              Draft a standing rule from this friction
            </SubmitButton>
          </form>
        )}
      </div>
    </>
  );
}
