import Link from "next/link";
import { promoteFriction } from "@/app/actions";
import { JournalEditor } from "@/components/JournalEditor";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { load } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { isWritten, journalStreak } from "@/lib/model";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const { journal } = await load("journal");
  const written = journal.filter(isWritten);
  const streak = journalStreak(journal);

  // Validated rather than trusted: this becomes a primary key on the entry,
  // and an unparseable one would be written straight through.
  const backfill = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;

  return (
    <>
      <PageHeader
        title="Log"
        meta={`${written.length} entries · ${streak}-day streak`}
      />

      <section className="panel" style={{ marginBottom: 16 }}>
        <header>
          <h3>{backfill ? fmtDate(backfill) : "Today"}</h3>
          {backfill && (
            <Link href="/log" className="num" style={{ color: "var(--accent)" }}>
              Back to today
            </Link>
          )}
        </header>
        <div className="body">
          {/* Keyed by day so switching dates remounts rather than carrying the
              previous day's unsaved edits across. */}
          <JournalEditor
            key={backfill ?? "today"}
            entries={journal}
            forDate={backfill ?? undefined}
          />
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="body">
          <form method="get" className="rowline">
            <label className="label" htmlFor="day">Write up another day</label>
            <input id="day" name="day" type="date" defaultValue={backfill ?? ""} style={{ width: "auto" }} />
            <button className="btn sm" type="submit">Open it</button>
          </form>
          <div className="hint" style={{ marginTop: 6 }}>
            A day you missed is still worth writing. Pick any date — it opens
            blank if nothing was logged.
          </div>
        </div>
      </section>

      <section className="panel">
        <header>
          <h3>Earlier entries</h3>
        </header>
        <div className="body flush">
          {written.length === 0 ? (
            <div className="empty">
              <strong>No entries yet.</strong>
              Three lines beats three paragraphs you won&rsquo;t write.
            </div>
          ) : (
            written.map((e) => (
              <div className="entry" key={e.id}>
                <div className="d">
                  {fmtDate(e.entry_date)}
                  {" · "}
                  <Link href={`/log?day=${e.entry_date}`} style={{ color: "var(--accent)" }}>
                    edit
                  </Link>
                </div>
                {e.entry && <p>{e.entry}</p>}
                {e.wins && (
                  <p>
                    <span className="tag">Went well · </span>
                    {e.wins}
                  </p>
                )}
                {e.friction && (
                  <>
                    <p>
                      <span className="tag">Friction · </span>
                      {e.friction}
                    </p>
                    <form action={promoteFriction}>
                      <input type="hidden" name="date" value={e.entry_date} />
                      <SubmitButton className="btn sm gh" pendingLabel="Opening…">
                        Draft a rule from this
                      </SubmitButton>
                    </form>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
