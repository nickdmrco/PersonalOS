import Link from "next/link";
import { addTask, deleteGoal, logGoalProgress } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ago } from "@/lib/dates";
import { drift, goalProgress, lastMovement } from "@/lib/model";
import type { Goal, Task } from "@/lib/types";

export function GoalCard({
  goal,
  tasks,
  compact = false,
}: {
  goal: Goal;
  tasks: Task[];
  compact?: boolean;
}) {
  const p = goalProgress(goal, tasks);
  const d = drift(goal, tasks);
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
              Edit
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
