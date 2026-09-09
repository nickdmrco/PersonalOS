"use client";

import { useOptimistic } from "react";
import { deleteTask, toggleFocus, toggleTask } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
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
  // The row mirrors the click immediately and reconciles when the server
  // answers. Every mutation here revalidates the layout, so the truth arrives
  // a whole page render later — long enough that an unacknowledged tick reads
  // as the app having ignored you. React holds these until the action settles,
  // then falls back to the props, so a rejected write corrects itself.
  const [done, setDone] = useOptimistic(task.status === "done");
  const [focus, setFocus] = useOptimistic(task.focus);

  const goal = task.goal_id ? goals.find((g) => g.id === task.goal_id) : null;
  const overdue = !done && task.due !== null && task.due < dkey();
  const hasSub = Boolean(goal || task.due || task.completed_at);

  async function submitToggle(formData: FormData) {
    setDone(!done);
    await toggleTask(formData);
  }

  async function submitFocus(formData: FormData) {
    setFocus(!focus);
    await toggleFocus(formData);
  }

  return (
    <div className={`task${done ? " done" : ""}`}>
      <form action={submitToggle}>
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
        <form action={submitFocus}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="focus" value={String(focus)} />
          <button
            type="submit"
            className={`star${focus ? " on" : ""}`}
            disabled={!focus && focusFull}
            aria-label={focus ? "Remove from focus" : "Add to focus"}
            title={
              !focus && focusFull
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
        <SubmitButton className="btn sm gh" aria-label={`Delete ${task.title}`} pendingLabel="…">
          Delete
        </SubmitButton>
      </form>
    </div>
  );
}
