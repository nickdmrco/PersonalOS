import { restoreRule, retireRule, saveRule } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { load } from "@/lib/data";
import { fmtDate } from "@/lib/dates";

/** Enough of the friction to recognise it, in the line that records where the
 *  rule came from. Now that the rule itself is rewritten, this is evidence
 *  rather than a duplicate of it. */
function excerpt(text: string) {
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const { rules, retired, journal } = await load("rules", "retired", "journal");

  // Arriving from "Promote to rule": the friction is loaded from the entry
  // itself rather than carried in the URL, so it is the stored text.
  const source = from ? journal.find((e) => e.entry_date === from) : undefined;
  const draft = source?.friction
    ? {
        text: source.friction,
        origin: `From friction logged ${fmtDate(source.entry_date)} · "${excerpt(source.friction)}"`,
      }
    : null;

  return (
    <>
      <PageHeader
        title="Standing rules"
        meta="Decisions made once, so you stop re-litigating them"
      />

      <div className="note" style={{ marginBottom: 16 }}>
        These should mostly arrive from your <b>friction</b> entries, not from a
        planning session. A rule you wrote before you had the evidence is a guess.
      </div>

      <details className="panel" style={{ marginBottom: 16 }} open={Boolean(draft)}>
        <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
          {draft ? "Turn this friction into a rule" : "Write a rule directly"}
        </summary>
        <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
          {draft && (
            <div className="note" style={{ marginBottom: 13 }}>
              This is what you wrote, not yet a rule. <b>Rewrite it as an
              instruction</b> — what should happen next time — and the friction
              stays recorded underneath as the evidence for it.
            </div>
          )}
          <form action={saveRule}>
            <div className="field">
              <label className="label" htmlFor="rule-text">The rule</label>
              <div className="hint">
                Write it as an instruction to your future self, not an aspiration.
              </div>
              <textarea
                id="rule-text"
                name="text"
                required
                defaultValue={draft?.text ?? ""}
                style={{ minHeight: 64 }}
                placeholder="Anything that takes under two minutes gets done before it gets written down"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="rule-origin">Where it came from</label>
              <div className="hint">
                A rule with a remembered origin survives; one without gets ignored.
              </div>
              <input
                id="rule-origin"
                name="origin"
                type="text"
                defaultValue={draft?.origin ?? ""}
              />
            </div>
            <SubmitButton className="btn pri" pendingLabel="Saving…">Save rule</SubmitButton>
          </form>
        </div>
      </details>

      <section className="panel">
        <div className="body flush">
          {rules.length === 0 ? (
            <div className="empty">
              <strong>No rules yet — as it should be on day one.</strong>
              Log friction for two weeks, then look for what repeats.
            </div>
          ) : (
            rules.map((r, i) => (
              <div className="rule" key={r.id}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div className="rt">{r.text}</div>
                  {r.origin && <div className="or">{r.origin}</div>}

                  <div className="rowline" style={{ marginTop: 8 }}>
                    <form action={retireRule}>
                      <input type="hidden" name="id" value={r.id} />
                      <SubmitButton className="btn sm gh" pendingLabel="Retiring…">Retire</SubmitButton>
                    </form>
                  </div>

                  <details style={{ marginTop: 6 }}>
                    <summary className="num" style={{ cursor: "pointer", color: "var(--accent)" }}>
                      Edit
                    </summary>
                    <form action={saveRule} style={{ marginTop: 9 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <div className="field">
                        <label className="label" htmlFor={`rt-${r.id}`}>The rule</label>
                        <textarea
                          id={`rt-${r.id}`}
                          name="text"
                          required
                          defaultValue={r.text}
                          style={{ minHeight: 58 }}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor={`ro-${r.id}`}>Where it came from</label>
                        <input
                          id={`ro-${r.id}`}
                          name="origin"
                          type="text"
                          defaultValue={r.origin}
                        />
                      </div>
                      <SubmitButton className="btn sm pri" pendingLabel="Saving…">Save changes</SubmitButton>
                    </form>
                  </details>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {retired.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <header>
            <h3>Retired</h3>
            <span className="num">{retired.length}</span>
          </header>
          <div className="body flush">
            {retired.map((r) => (
              <div className="rule" key={r.id}>
                <span className="n" style={{ color: "var(--ink-3)" }}>—</span>
                <div style={{ flex: 1 }}>
                  <div className="rt" style={{ color: "var(--ink-3)" }}>{r.text}</div>
                  {r.origin && <div className="or">{r.origin}</div>}
                  <form action={restoreRule} style={{ marginTop: 8 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="btn sm gh" pendingLabel="Restoring…">
                      Bring back
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
