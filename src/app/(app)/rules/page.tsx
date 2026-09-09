import { retireRule, saveRule } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { loadAll } from "@/lib/data";

export default async function RulesPage() {
  const { rules } = await loadAll();

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

      <details className="panel" style={{ marginBottom: 16 }}>
        <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
          Write a rule directly
        </summary>
        <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
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
                style={{ minHeight: 64 }}
                placeholder="Anything that takes under two minutes gets done before it gets written down"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="rule-origin">Where it came from</label>
              <div className="hint">
                A rule with a remembered origin survives; one without gets ignored.
              </div>
              <input id="rule-origin" name="origin" type="text" />
            </div>
            <button className="btn pri" type="submit">Save rule</button>
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
                  <form action={retireRule} style={{ marginTop: 8 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn sm gh" type="submit">Retire</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
