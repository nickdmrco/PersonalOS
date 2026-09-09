import { addTask } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FOCUS_CAP } from "@/lib/model";
import type { Goal } from "@/lib/types";

/**
 * The only place a task can be given a due date. Everything else that makes
 * tasks — the inbox exits, the review, a goal card — makes them undated on
 * purpose, because a date assigned in bulk is a date you won't keep.
 */
export function TaskForm({ goals, focusLeft }: { goals: Goal[]; focusLeft: number }) {
  return (
    <form action={addTask}>
      <div className="field">
        <label className="label" htmlFor="t-title">
          The next physical action
        </label>
        <div className="hint">
          Something you could start without deciding anything else first.
        </div>
        <input
          id="t-title"
          name="title"
          type="text"
          required
          autoComplete="off"
          placeholder="Draft the two paragraphs on pricing"
        />
      </div>

      <div className="split">
        <div className="field">
          <label className="label" htmlFor="t-due">
            Due
          </label>
          <div className="hint">Optional. A date you would actually defend.</div>
          <input id="t-due" name="due" type="date" />
        </div>

        <div className="field">
          <label className="label" htmlFor="t-goal">
            Toward a goal
          </label>
          <div className="hint">
            {goals.length
              ? "Optional — but an untethered task is one nothing will miss."
              : "No goals this quarter to attach it to."}
          </div>
          <select id="t-goal" name="goal_id" defaultValue="">
            <option value="">Nothing in particular</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rowline">
        <SubmitButton className="btn pri" pendingLabel="Adding…">
          Add task
        </SubmitButton>
        {focusLeft > 0 ? (
          <label
            className="num"
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <input type="checkbox" name="focus" value="true" />
            Star it — {focusLeft} of {FOCUS_CAP} slots free
          </label>
        ) : (
          <span className="num" style={{ color: "var(--ink-3)" }}>
            Focus is full at {FOCUS_CAP}. Finish or unstar something first.
          </span>
        )}
      </div>
    </form>
  );
}
