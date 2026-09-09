import Link from "next/link";
import { CoursePlot } from "@/components/CoursePlot";
import { GoalCard } from "@/components/GoalCard";
import { JournalEditor } from "@/components/JournalEditor";
import { PageHeader } from "@/components/PageHeader";
import { TaskRow } from "@/components/TaskRow";
import { loadAll } from "@/lib/data";
import { DAY, daysBetween, dkey, qBounds, qkey } from "@/lib/dates";
import { drift, ruleOfDay } from "@/lib/model";

function sevenDaysAgoMs() {
  return Date.now() - 7 * DAY;
}

export default async function TodayPage() {
  const { goals, tasks, journal, rules } = await loadAll();
  const now = new Date();
  const today = dkey(now);
  const [qs, qe] = qBounds(now);
  const elapsed = Math.round((daysBetween(qs, now) / daysBetween(qs, qe)) * 100);

  const quarterGoals = goals.filter((g) => !g.archived && g.quarter === qkey(now));
  const open = tasks.filter((t) => t.status !== "done");
  const focus = open.filter((t) => t.focus);
  const due = open.filter((t) => !t.focus && t.due !== null && t.due <= today);
  const rest = open.filter((t) => !t.focus && !(t.due !== null && t.due <= today));
  const doneSince = sevenDaysAgoMs();
  const recentDone = tasks
    .filter((t) => t.completed_at && new Date(t.completed_at).getTime() > doneSince)
    .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));

  const drifting = quarterGoals.filter((g) => drift(g, tasks).state !== "ok");
  const rod = ruleOfDay(rules);
  const rodIndex = rod ? rules.findIndex((r) => r.id === rod.id) + 1 : 0;

  return (
    <>
      <PageHeader
        title={now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        meta={`${qkey(now)} · day ${daysBetween(qs, now)} of ${daysBetween(qs, qe)} · ${elapsed}% elapsed`}
      />

      <div className="grid g2">
        <div className="grid" style={{ alignContent: "start" }}>
          <section className="panel">
            <header>
              <h3>Focus — the three that matter</h3>
              <span className="num">{focus.length}/3</span>
            </header>
            <div className="body flush">
              {focus.length ? (
                <div className="tasks">
                  {focus.map((t) => (
                    <TaskRow key={t.id} task={t} goals={goals} />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <strong>Nothing starred yet.</strong>
                  Star up to three open tasks. If everything is a priority, the
                  list is just a backlog wearing a costume.
                </div>
              )}
            </div>
          </section>

          {due.length > 0 && (
            <section className="panel">
              <header>
                <h3>Due today or overdue</h3>
              </header>
              <div className="body flush">
                <div className="tasks">
                  {due.map((t) => (
                    <TaskRow key={t.id} task={t} goals={goals} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="panel">
            <header>
              <h3>Today&rsquo;s log</h3>
              <Link href="/log" className="num" style={{ color: "var(--accent)" }}>
                All entries
              </Link>
            </header>
            <div className="body">
              <JournalEditor entries={journal} />
            </div>
          </section>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <section className="panel">
            <header>
              <h3>Quarter goals</h3>
              <Link href="/goals" className="num" style={{ color: "var(--accent)" }}>
                All
              </Link>
            </header>
            <div className="body flush">
              {quarterGoals.length ? (
                quarterGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} tasks={tasks} compact />
                ))
              ) : (
                <div className="empty">
                  <strong>No goals this quarter.</strong>
                  Three to five, each with a written finish line.
                </div>
              )}
            </div>
          </section>

          {drifting.length > 0 && (
            <section className="panel">
              <header>
                <h3>Needs attention</h3>
              </header>
              <div className="body">
                <div className="note">
                  <b>
                    {drifting.length} goal{drifting.length > 1 ? "s have" : " has"} stopped
                    moving.
                  </b>{" "}
                  {drifting
                    .map((g) => `${g.title} — nothing completed in ${drift(g, tasks).days} days`)
                    .join("; ")}
                  . Either it matters and it needs a task this week, or it
                  doesn&rsquo;t and it should be cut at the next review.
                </div>
              </div>
            </section>
          )}

          <section className="panel">
            <header>
              <h3>Standing order for today</h3>
            </header>
            <div className="body">
              {rod ? (
                <div className="rule" style={{ padding: 0, border: 0 }}>
                  <span className="n">{String(rodIndex).padStart(2, "0")}</span>
                  <div>
                    <div className="rt">{rod.text}</div>
                    {rod.origin && <div className="or">{rod.origin}</div>}
                  </div>
                </div>
              ) : (
                <div className="empty">
                  <strong>No rules yet.</strong>
                  They&rsquo;ll accumulate from your friction entries.
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <header>
              <h3>Course plot — tasks completed</h3>
            </header>
            <div className="body">
              <CoursePlot tasks={tasks} />
            </div>
          </section>

          {rest.length > 0 && (
            <section className="panel">
              <header>
                <h3>Everything else open</h3>
                <span className="num">{rest.length}</span>
              </header>
              <div className="body flush">
                <div className="tasks">
                  {rest.slice(0, 8).map((t) => (
                    <TaskRow key={t.id} task={t} goals={goals} />
                  ))}
                </div>
                {rest.length > 8 && (
                  <div className="empty" style={{ padding: 11 }}>
                    + {rest.length - 8} more
                  </div>
                )}
              </div>
            </section>
          )}

          {recentDone.length > 0 && (
            <section className="panel">
              <header>
                <h3>Completed · last 7 days</h3>
                <span className="num">{recentDone.length} · click to undo</span>
              </header>
              <div className="body flush">
                <div className="tasks">
                  {recentDone.slice(0, 10).map((t) => (
                    <TaskRow key={t.id} task={t} goals={goals} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
