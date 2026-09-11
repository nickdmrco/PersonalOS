import { archiveGoal, carryForwardGoal, unarchiveGoal } from "@/app/actions";
import { GoalCard } from "@/components/GoalCard";
import { GoalForm } from "@/components/GoalForm";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { load } from "@/lib/data";
import { qkey } from "@/lib/dates";
import { goalProgress } from "@/lib/model";

export default async function GoalsPage() {
  const { goals, tasks, dreams } = await load("goals", "tasks", "dreams");
  const q = qkey();
  const active = goals.filter((g) => !g.archived && g.quarter === q);
  // A goal whose quarter has passed but which was never resolved. These are
  // the ones the quarter should have ended with a decision about.
  const unresolved = goals.filter((g) => !g.archived && g.quarter !== q);
  const archived = goals.filter((g) => g.archived);

  return (
    <>
      <PageHeader
        title="Goals"
        meta={`${q} · three to five, each with a finish line`}
      />

      {active.length > 5 && (
        <div className="note" style={{ marginBottom: 16 }}>
          <b>{active.length} active goals.</b> More than five and none of them are
          real. Cut some at the next review.
        </div>
      )}

      <details className="panel" style={{ marginBottom: 16 }}>
        <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
          New goal
        </summary>
        <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
          <GoalForm dreams={dreams} />
        </div>
      </details>

      <section className="panel">
        <header>
          <h3>This quarter</h3>
          <span className="num">{active.length}</span>
        </header>
        <div className="body flush">
          {active.length === 0 ? (
            <div className="empty">
              <strong>No goals set for {q}.</strong>
              A goal without a written definition of done is a mood.
            </div>
          ) : (
            active.map((g) => <GoalCard key={g.id} goal={g} tasks={tasks} />)
          )}
        </div>
      </section>

      {unresolved.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <header>
            <h3>Left open from earlier quarters</h3>
            <span className="num">{unresolved.length}</span>
          </header>
          <div className="body">
            <div className="note">
              A quarter should end with a decision on each goal. <b>Carry it
              forward</b> and it starts again at zero in {q}; <b>put it to bed</b>
              and it stops asking. Neither destroys anything — the tasks done for
              it stay in the log either way.
            </div>
          </div>
          <div className="body flush">
            {unresolved.map((g) => (
              <div className="goal" key={g.id}>
                <div className="gh">
                  <div>
                    <div className="gt" style={{ fontSize: 15 }}>{g.title}</div>
                    <div className="num" style={{ color: "var(--ink-3)" }}>
                      {g.quarter} · {goalProgress(g, tasks).label}
                    </div>
                  </div>
                </div>
                <div className="rowline">
                  <form action={carryForwardGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <SubmitButton className="btn sm" pendingLabel="Carrying…">
                      Carry forward to {q}
                    </SubmitButton>
                  </form>
                  <form action={archiveGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <SubmitButton className="btn sm gh" pendingLabel="Closing…">
                      Put it to bed
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <details className="panel" style={{ marginTop: 16 }}>
          <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
            Closed goals ({archived.length})
          </summary>
          <div className="body flush" style={{ borderTop: "1px solid var(--line)" }}>
            {archived.map((g) => (
              <div className="goal" key={g.id}>
                <div className="gh">
                  <div>
                    <div className="gt" style={{ fontSize: 14, color: "var(--ink-3)" }}>
                      {g.title}
                    </div>
                    <div className="num" style={{ color: "var(--ink-3)" }}>
                      {g.quarter} · {goalProgress(g, tasks).label}
                    </div>
                  </div>
                </div>
                <div className="rowline">
                  <form action={unarchiveGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <SubmitButton className="btn sm gh" pendingLabel="Reopening…">
                      Reopen
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
