import { GoalCard } from "@/components/GoalCard";
import { GoalForm } from "@/components/GoalForm";
import { PageHeader } from "@/components/PageHeader";
import { load } from "@/lib/data";
import { qkey } from "@/lib/dates";
import { goalProgress } from "@/lib/model";

export default async function GoalsPage() {
  const { goals, tasks, dreams } = await load("goals", "tasks", "dreams");
  const q = qkey();
  const active = goals.filter((g) => !g.archived && g.quarter === q);
  const past = goals.filter((g) => g.archived || g.quarter !== q);

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

      {past.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <header>
            <h3>Past quarters</h3>
          </header>
          <div className="body flush">
            {past.map((g) => (
              <div className="goal" key={g.id}>
                <div className="gh">
                  <div>
                    <div className="gt" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                      {g.title}
                    </div>
                    <div className="num" style={{ color: "var(--ink-3)" }}>
                      {g.quarter} · {goalProgress(g, tasks).label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
