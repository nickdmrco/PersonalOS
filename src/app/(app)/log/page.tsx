import { promoteFriction } from "@/app/actions";
import { JournalEditor } from "@/components/JournalEditor";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { load } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { isWritten, journalStreak } from "@/lib/model";

export default async function LogPage() {
  const { journal } = await load("journal");
  const written = journal.filter(isWritten);
  const streak = journalStreak(journal);

  return (
    <>
      <PageHeader
        title="Log"
        meta={`${written.length} entries · ${streak}-day streak`}
      />

      <section className="panel" style={{ marginBottom: 16 }}>
        <header>
          <h3>Today</h3>
        </header>
        <div className="body">
          <JournalEditor entries={journal} />
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
                <div className="d">{fmtDate(e.entry_date)}</div>
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
                      <input type="hidden" name="friction" value={e.friction} />
                      <SubmitButton className="btn sm gh" pendingLabel="Promoting…">
                        Promote to rule
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
