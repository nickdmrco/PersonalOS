import { dkey, monday, parseKey } from "./dates";
import { drift, goalProgress, isWritten } from "./model";
import type { DriftState, Goal, JournalEntry, Review, Task } from "./types";

export type DigestGoal = {
  title: string;
  progress: string;
  state: DriftState;
  drift: string;
  days: number;
};

export type Digest = {
  /** Monday of the week being summarised, as a date key. */
  weekOf: string;
  /** True when the review for this week already exists, in which case there
   *  is nothing to nudge about and the caller should send nothing. */
  reviewed: boolean;
  completed: string[];
  goals: DigestGoal[];
  drifting: DigestGoal[];
  frictions: { date: string; text: string }[];
  daysLogged: number;
};

/**
 * Everything the weekly email says, derived from the same data the review
 * screen reads. Pure, so it can be tested without a database or a mailbox.
 *
 * It gathers and it does not judge: the friction is listed, not scanned for
 * repetition. Deciding what has shown up twice is the one piece of thinking
 * the review asks of you, and an automated guess at it would either be wrong
 * or would do the part that is supposed to be yours.
 */
export function buildDigest(
  {
    goals,
    tasks,
    journal,
    reviews,
  }: {
    goals: Goal[];
    tasks: Task[];
    journal: JournalEntry[];
    reviews: Review[];
  },
  now: Date = new Date(),
): Digest {
  const mon = monday(now);
  const weekOf = dkey(mon);

  const completed = tasks
    .filter((t) => t.completed_at && new Date(t.completed_at) >= mon)
    .sort((a, b) => String(a.completed_at).localeCompare(String(b.completed_at)))
    .map((t) => t.title);

  const active = goals.filter((g) => !g.archived);
  const described = active.map((g): DigestGoal => {
    const d = drift(g, tasks, now);
    return {
      title: g.title,
      progress: goalProgress(g, tasks).label,
      state: d.state,
      drift: d.label,
      days: d.days,
    };
  });

  const week = journal.filter(
    (e) => isWritten(e) && parseKey(e.entry_date) >= mon,
  );

  return {
    weekOf,
    reviewed: reviews.some((r) => r.week_of === weekOf),
    completed,
    goals: described,
    drifting: described.filter((g) => g.state !== "ok"),
    frictions: week
      .filter((e) => e.friction.trim() !== "")
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
      .map((e) => ({ date: e.entry_date, text: e.friction })),
    daysLogged: week.length,
  };
}
