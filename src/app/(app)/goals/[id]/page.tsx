import { notFound } from "next/navigation";
import { GoalForm } from "@/components/GoalForm";
import { TaskRow } from "@/components/TaskRow";
import { load } from "@/lib/data";
import { ago } from "@/lib/dates";
import { drift, goalProgress, lastMovement } from "@/lib/model";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { goals, dreams, tasks } = await load("goals", "dreams", "tasks");
  const goal = goals.find((g) => g.id === id);
  if (!goal) notFound();

  // The page was an edit form and nothing else, so the obvious question here
  // — what is actually being done about this goal — had no answer on it.
  const mine = tasks.filter((t) => t.goal_id === goal.id);
  const open = mine.filter((t) => t.status !== "done");
  const done = mine
    .filter((t) => t.status === "done")
    .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));

  const p = goalProgress(goal, tasks);
  const d = drift(goal, tasks);

  return (
    <>
      <div className="top">
        <div>
          <h2>{goal.title}</h2>
          <div className="meta">
            {goal.quarter} · {p.label} · last movement{" "}
            {ago(new Date(lastMovement(goal, tasks)).toISOString())}
          </div>
        </div>
        <span className={`chip ${d.state}`}>
          <span className="dot" />
          {d.label}
        </span>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <header>
          <h3>Open tasks</h3>
          <span className="num">{open.length}</span>
        </header>
        <div className="body flush">
          {open.length ? (
            <div className="tasks">
              {open.map((t) => (
                <TaskRow key={t.id} task={t} goals={goals} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <strong>Nothing open against this goal.</strong>
              {d.state === "ok"
                ? "Give it one at the next review."
                : "That is why it is drifting."}
            </div>
          )}
        </div>
      </section>

      {done.length > 0 && (
        <section className="panel" style={{ marginBottom: 16 }}>
          <header>
            <h3>Completed</h3>
            <span className="num">{done.length}</span>
          </header>
          <div className="body flush">
            <div className="tasks">
              {done.slice(0, 12).map((t) => (
                <TaskRow key={t.id} task={t} goals={goals} />
              ))}
            </div>
          </div>
        </section>
      )}

      <details className="panel">
        <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
          Edit this goal
        </summary>
        <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
          <GoalForm goal={goal} dreams={dreams} />
        </div>
      </details>
    </>
  );
}
