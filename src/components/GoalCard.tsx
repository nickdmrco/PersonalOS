import Link from "next/link";
import { addTask, deleteGoal, logGoalProgress } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ago } from "@/lib/dates";
import { TaskRow } from "@/components/TaskRow";
import { drift, goalProgress, lastMovement } from "@/lib/model";
import type { Goal, Task } from "@/lib/types";

export function GoalCard({
  goal,
  tasks,
  goals = [],
  compact = false,
}: {
  goal: Goal;
  tasks: Task[];
  /** Every goal, so a task's own editor can offer them. Only needed when the
   *  card lists tasks, which `compact` does not. */
  goals?: Goal[];
  compact?: boolean;
}) {
  const p = goalProgress(goal, tasks);
  const d = drift(goal, tasks);
  // The card already let you add a task to this goal and then never showed it
  // to you. Listing them is opt-in so a page of goals stays scannable, but the
  // count is always visible — a goal with nothing open is the one about to
  // start drifting, and that is worth seeing without a click.
  const open = tasks.filter((t) => t.goal_id === goal.id && t.status !== "done");
  const numeric = typeof goal.target === "number" && goal.target > 0;

  return (
    <div className="goal">
      <div className="gh">
        <div>
          <div className="gt">{goal.title}</div>
          {goal.done_when && (
            <div className="dw">
              <em>Done when</em>
              {goal.done_when}
            </div>
          )}
        </div>
        <span className={`chip ${d.state}`}>
          <span className="dot" />
          {d.label}
        </span>
      </div>

      <div className="meter">
        <div className="track">
          <div className={`fill ${d.state}`} style={{ width: `${p.pct.toFixed(1)}%` }} />
        </div>
        <span className="num">{p.label}</span>
      </div>

      {!compact && (
        <>
          <div className="rowline">
            <span className="num" style={{ color: "var(--ink-3)" }}>
              Last movement {ago(new Date(lastMovement(goal, tasks)).toISOString())}
            </span>
            <Link className="btn sm" href={`/goals/${goal.id}`}>
              Open
            </Link>
            <form action={deleteGoal}>
              <input type="hidden" name="id" value={goal.id} />
              <SubmitButton className="btn sm gh" pendingLabel="Deleting…">
                Delete
              </SubmitButton>
            </form>
          </div>

          <details>
            <summary className="num" style={{ cursor: "pointer", color: "var(--accent)" }}>
              Open tasks ({open.length})
            </summary>
            <div style={{ marginTop: 8 }}>
              {open.length ? (
                <div className="tasks">
                  {open.map((t) => (
                    <TaskRow key={t.id} task={t} goals={goals} hideGoal />
                  ))}
                </div>
              ) : (
                <div className="num" style={{ color: "var(--ink-3)" }}>
                  Nothing open against this goal
                  {d.state === "ok" ? " — give it one at the next review." : " — which is why it is drifting."}
                </div>
              )}
            </div>
          </details>

          <details>
            <summary className="num" style={{ cursor: "pointer", color: "var(--accent)" }}>
              Add a task
            </summary>
            <form action={addTask} className="rowline" style={{ marginTop: 8 }}>
              <input type="hidden" name="goal_id" value={goal.id} />
              <input
                name="title"
                type="text"
                required
                placeholder="The next physical action"
                style={{ flex: 1, minWidth: 200 }}
              />
              <input
                name="due"
                type="date"
                aria-label="Due date, optional"
                style={{ width: "auto" }}
              />
              <SubmitButton className="btn sm pri" pendingLabel="Adding…">
                Add
              </SubmitButton>
            </form>
          </details>

          {numeric && (
            <details>
              <summary className="num" style={{ cursor: "pointer", color: "var(--accent)" }}>
                Log progress
              </summary>
              <form action={logGoalProgress} className="rowline" style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={goal.id} />
                <input
                  name="current"
                  type="number"
                  step="any"
                  defaultValue={goal.current}
                  style={{ width: 120 }}
                  aria-label={`Current value${goal.unit ? ` in ${goal.unit}` : ""}`}
                />
                <span className="num">
                  of {goal.target} {goal.unit}
                </span>
                <SubmitButton className="btn sm pri" pendingLabel="Saving…">
                  Save
                </SubmitButton>
              </form>
            </details>
          )}
        </>
      )}
    </div>
  );
}
