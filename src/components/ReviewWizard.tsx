"use client";

import { useState } from "react";
import { finishReview } from "@/app/actions";
import { fmtDate } from "@/lib/dates";
import { drift, goalProgress } from "@/lib/model";
import type { Goal, JournalEntry, Task } from "@/lib/types";

const STEPS = ["Harvest", "Position", "Rules", "Set course"];

/**
 * One form across four steps. Inactive steps stay mounted and hidden, so
 * every field still submits — no draft state to lose by stepping back.
 */
export function ReviewWizard({
  weekOf,
  goals,
  tasks,
  completed,
  frictions,
}: {
  weekOf: string;
  goals: Goal[];
  tasks: Task[];
  completed: Task[];
  frictions: JournalEntry[];
}) {
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;

  return (
    <form action={finishReview}>
      <div className="panel">
        <header>
          <h3>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </h3>
          <span className="num">Week of {fmtDate(weekOf)}</span>
        </header>

        <div className="body">
          <div hidden={step !== 0}>
            <p style={{ marginTop: 0, maxWidth: "62ch" }}>
              You completed <b>{completed.length}</b> task
              {completed.length === 1 ? "" : "s"} since Monday.
            </p>
            {completed.length > 0 && (
              <div className="panel" style={{ marginBottom: 14 }}>
                <div className="body flush">
                  <div className="tasks">
                    {completed.map((t) => (
                      <div className="task done" key={t.id}>
                        <div className="t">
                          <div className="ttl">{t.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="field">
              <label className="label" htmlFor="r-notes">
                What actually happened this week
              </label>
              <div className="hint">Not what you planned. What happened.</div>
              <textarea id="r-notes" name="notes" style={{ minHeight: 150 }} />
            </div>
          </div>

          <div hidden={step !== 1}>
            {goals.length === 0 ? (
              <div className="empty">
                <strong>No goals this quarter.</strong>
                Skip ahead — you can set them after the review.
              </div>
            ) : (
              goals.map((g) => {
                const p = goalProgress(g, tasks);
                const d = drift(g, tasks);
                const numeric = typeof g.target === "number" && g.target > 0;
                return (
                  <div className="field" key={g.id}>
                    <label className="label" htmlFor={`gn-${g.id}`}>
                      {g.title}
                    </label>
                    <div className="meter" style={{ marginBottom: 6 }}>
                      <div className="track">
                        <div className={`fill ${d.state}`} style={{ width: `${p.pct.toFixed(1)}%` }} />
                      </div>
                      <span className="num">{p.label}</span>
                      <span className={`chip ${d.state}`}>
                        <span className="dot" />
                        {d.label}
                      </span>
                    </div>
                    {numeric ? (
                      <input
                        id={`gn-${g.id}`}
                        type="number"
                        step="any"
                        name={`goalnum:${g.id}`}
                        defaultValue={g.current}
                      />
                    ) : (
                      <div className="hint">Progress tracked by tasks completed.</div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div hidden={step !== 2}>
            <p style={{ marginTop: 0, maxWidth: "62ch" }}>
              Friction you logged this week. Anything that has now shown up more
              than once has earned a rule.
            </p>
            {frictions.length === 0 ? (
              <div className="empty">
                <strong>No friction logged this week.</strong>
                Either a clean week, or you didn&rsquo;t write it down.
              </div>
            ) : (
              frictions.map((f) => (
                <div
                  className="entry"
                  key={f.id}
                  style={{ border: "1px solid var(--line)", borderRadius: 6, marginBottom: 9 }}
                >
                  <div className="d">{fmtDate(f.entry_date)}</div>
                  <p>{f.friction}</p>
                </div>
              ))
            )}
            <div className="field" style={{ marginTop: 14 }}>
              <label className="label" htmlFor="r-newrule">
                Write a standing rule from it
              </label>
              <input id="r-newrule" name="newrule" type="text" placeholder="No meetings before 11am" />
            </div>
          </div>

          <div hidden={step !== 3}>
            <p style={{ marginTop: 0, maxWidth: "62ch" }}>
              One concrete task per goal for the coming week. Leave a box empty to
              skip that goal — deliberately skipping is a valid call; forgetting is
              not.
            </p>
            {goals.map((g) => (
              <div className="field" key={g.id}>
                <label className="label" htmlFor={`nt-${g.id}`}>
                  {g.title}
                </label>
                <input
                  id={`nt-${g.id}`}
                  name={`nexttask:${g.id}`}
                  type="text"
                  placeholder="The next physical action"
                />
              </div>
            ))}
            <div className="field">
              <label className="label" htmlFor="nt-none">
                Anything else, not tied to a goal
              </label>
              <input id="nt-none" name="nexttask:none" type="text" />
            </div>
          </div>
        </div>

        <div
          className="body"
          style={{ borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}
        >
          <button
            type="button"
            className="btn gh"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < last ? (
            <button type="button" className="btn pri" onClick={() => setStep((s) => s + 1)}>
              Next — {STEPS[step + 1]}
            </button>
          ) : (
            <button type="submit" className="btn pri">
              Finish review
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
