import { deleteTask, toggleFocus, toggleTask } from "@/app/actions";
import { ago, dkey, fmtDate } from "@/lib/dates";
import { FOCUS_CAP } from "@/lib/model";
import type { Goal, Task } from "@/lib/types";

export function TaskRow({
  task,
  goals,
  focusFull = false,
}: {
  task: Task;
  goals: Goal[];
  /** All focus slots are taken, so this task can be unstarred but not starred. */
  focusFull?: boolean;
}) {
  const done = task.status === "done";
  const goal = task.goal_id ? goals.find((g) => g.id === task.goal_id) : null;
  const overdue = !done && task.due !== null && task.due < dkey();
  const hasSub = Boolean(goal || task.due || task.completed_at);

  return (
    <div className={`task${done ? " done" : ""}`}>
      <form action={toggleTask}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="done" value={String(done)} />
        <button
          type="submit"
          className="box"
          aria-label={done ? "Mark as not done" : "Mark as done"}
        >
          {done && (
            <svg viewBox="0 0 10 10" width="9" height="9" fill="none" aria-hidden="true">
              <path
                d="M1 5l2.6 2.6L9 2"
                stroke="var(--surface)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>

      <div className="t">
        <div className="ttl">{task.title}</div>
        {hasSub && (
          <div className="sub">
            {goal && <span>{goal.title}</span>}
            {!done && task.due && (
              <span className={overdue ? "od" : undefined}>
                {overdue ? "overdue " : "due "}
                {fmtDate(task.due)}
              </span>
            )}
            {done && task.completed_at && <span>done {ago(task.completed_at)}</span>}
          </div>
        )}
      </div>

      {!done && (
        <form action={toggleFocus}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="focus" value={String(task.focus)} />
          <button
            type="submit"
            className={`star${task.focus ? " on" : ""}`}
            disabled={!task.focus && focusFull}
            aria-label={task.focus ? "Remove from focus" : "Add to focus"}
            title={
              !task.focus && focusFull
                ? `Focus is full at ${FOCUS_CAP} — unstar something first`
                : "Focus"
            }
          >
            ★
          </button>
        </form>
      )}

      <form action={deleteTask}>
        <input type="hidden" name="id" value={task.id} />
        <button type="submit" className="btn sm gh" aria-label={`Delete ${task.title}`}>
          Delete
        </button>
      </form>
    </div>
  );
}
