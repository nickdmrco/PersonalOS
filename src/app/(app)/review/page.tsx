import { ReviewWizard } from "@/components/ReviewWizard";
import { PageHeader } from "@/components/PageHeader";
import { load } from "@/lib/data";
import { ago, dkey, fmtDate, monday, parseKey, qkey } from "@/lib/dates";
import { FOCUS_CAP } from "@/lib/model";

export default async function ReviewPage() {
  const { goals, tasks, journal, reviews } = await load("goals", "tasks", "journal", "reviews");
  const mon = monday();
  const weekOf = dkey(mon);

  const activeGoals = goals.filter((g) => !g.archived && g.quarter === qkey());
  const completed = tasks.filter(
    (t) => t.completed_at && new Date(t.completed_at) >= mon,
  );
  const frictions = journal.filter(
    (e) => e.friction && parseKey(e.entry_date) >= mon,
  );
  const last = reviews[0];
  const doneThisWeek = last?.week_of === weekOf;
  const focusLeft = Math.max(
    0,
    FOCUS_CAP - tasks.filter((t) => t.status !== "done" && t.focus).length,
  );

  return (
    <>
      <PageHeader
        title="Weekly review"
        meta="The only moment a dream turns into a task"
      />

      <div className="note" style={{ marginBottom: 16 }}>
        This is the scheduler. Without it the top of the stack is decoration:
        dreams and goals sit still while tasks arrive from wherever tasks
        actually arrive from. <b>Twenty minutes, once a week.</b>
      </div>

      {doneThisWeek && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="body">
            <b>Already done for this week.</b> Reviewed {ago(last.created_at)}. You
            can run it again — it will log a second entry for the same week.
          </div>
        </div>
      )}

      <ReviewWizard
        weekOf={weekOf}
        goals={activeGoals}
        tasks={tasks}
        completed={completed}
        frictions={frictions}
        focusLeft={focusLeft}
      />

      {reviews.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <header>
            <h3>Past reviews</h3>
          </header>
          <div className="body flush">
            {reviews.map((r) => (
              <div className="entry" key={r.id}>
                <div className="d">
                  Week of {fmtDate(r.week_of)} · {r.completed_count} completed
                </div>
                {r.notes ? <p>{r.notes}</p> : <p style={{ color: "var(--ink-3)" }}>No notes.</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
