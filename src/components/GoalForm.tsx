import { saveGoal } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Dream, Goal } from "@/lib/types";

export function GoalForm({ goal, dreams }: { goal?: Goal; dreams: Dream[] }) {
  return (
    <form action={saveGoal}>
      {goal && <input type="hidden" name="id" value={goal.id} />}

      <div className="field">
        <label className="label" htmlFor="g-title">Goal</label>
        <input
          id="g-title"
          name="title"
          type="text"
          required
          defaultValue={goal?.title}
          placeholder="Ship the portfolio site"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="g-done">Done when</label>
        <div className="hint">
          Write the finish line as an observable fact, not a feeling.
        </div>
        <textarea
          id="g-done"
          name="done_when"
          style={{ minHeight: 56 }}
          defaultValue={goal?.done_when}
          placeholder="The site is live at my domain and three people I respect have given feedback"
        />
      </div>

      <div className="split">
        <div className="field">
          <label className="label" htmlFor="g-target">Target number (optional)</label>
          <input
            id="g-target"
            name="target"
            type="number"
            step="any"
            defaultValue={goal?.target ?? ""}
            placeholder="12"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="g-unit">Unit</label>
          <input
            id="g-unit"
            name="unit"
            type="text"
            defaultValue={goal?.unit}
            placeholder="sessions, kg, chapters"
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="g-dream">Serves which dream</label>
        <select id="g-dream" name="dream_id" defaultValue={goal?.dream_id ?? ""}>
          <option value="">— none (fine for now) —</option>
          {dreams.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      </div>

      <SubmitButton className="btn pri" pendingLabel="Saving…">Save goal</SubmitButton>
    </form>
  );
}
