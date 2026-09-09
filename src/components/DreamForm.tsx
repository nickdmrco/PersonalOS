import { saveDream } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Dream } from "@/lib/types";

export function DreamForm({ dream }: { dream?: Dream }) {
  return (
    <form action={saveDream}>
      {dream && <input type="hidden" name="id" value={dream.id} />}
      <div className="field">
        <label className="label" htmlFor="d-title">Name it</label>
        <input
          id="d-title"
          name="title"
          type="text"
          required
          defaultValue={dream?.title}
          placeholder="Work I&rsquo;d do for free"
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="d-body">Describe it</label>
        <div className="hint">
          Prose. Present tense. What does an ordinary Tuesday look like once this
          is true?
        </div>
        <textarea id="d-body" name="body" style={{ minHeight: 150 }} defaultValue={dream?.body} />
      </div>
      <SubmitButton className="btn pri" pendingLabel="Saving…">Save</SubmitButton>
    </form>
  );
}
