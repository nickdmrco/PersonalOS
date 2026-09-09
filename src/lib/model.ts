import { DAY, dkey, localDayIndex, monday } from "./dates";
import type { DriftState, Goal, JournalEntry, Rule, Task } from "./types";

/**
 * The one hard limit in the system. Three is not a suggestion: a focus list
 * that grows to fit whatever you star is the backlog again, wearing a nicer
 * heading. Enforced in `toggleFocus` and respected by the weekly review.
 */
export const FOCUS_CAP = 3;

/**
 * Progress toward a goal. A goal with a numeric target reports against it;
 * otherwise progress is the share of its tasks that are done.
 */
export function goalProgress(goal: Goal, tasks: Task[]) {
  const mine = tasks.filter((t) => t.goal_id === goal.id);

  if (typeof goal.target === "number" && goal.target > 0) {
    const pct = Math.max(0, Math.min(100, (goal.current / goal.target) * 100));
    return {
      pct,
      label: `${goal.current} / ${goal.target}${goal.unit ? ` ${goal.unit}` : ""}`,
    };
  }

  const done = mine.filter((t) => t.status === "done").length;
  return {
    pct: mine.length ? (done / mine.length) * 100 : 0,
    label: mine.length ? `${done} / ${mine.length} tasks` : "no tasks yet",
  };
}

/** Most recent evidence that a goal is alive. */
export function lastMovement(goal: Goal, tasks: Task[]): number {
  let ms = new Date(goal.progress_updated_at ?? goal.created_at).getTime();
  for (const t of tasks) {
    if (t.goal_id === goal.id && t.completed_at) {
      ms = Math.max(ms, new Date(t.completed_at).getTime());
    }
  }
  return ms;
}

/**
 * The system's one piece of unsolicited opinion: a goal nothing has moved
 * in a fortnight is drifting, and in a month it is off course. Paired with
 * a text label everywhere it renders — never colour alone.
 */
export function drift(
  goal: Goal,
  tasks: Task[],
): { state: DriftState; label: string; days: number } {
  const days = Math.round((Date.now() - lastMovement(goal, tasks)) / DAY);
  if (days >= 28) return { state: "bad", label: "Off course", days };
  if (days >= 14) return { state: "warn", label: "Drifting", days };
  return { state: "ok", label: "On course", days };
}

/** An entry counts only if something was actually written in it. */
export function isWritten(e: JournalEntry): boolean {
  return Boolean(e.entry || e.wins || e.friction);
}

/**
 * Consecutive days written, ending today *or yesterday*. Today not being
 * written yet is not a broken streak — counting from today alone means every
 * run in the log reads as zero from midnight until you next sit down, which
 * punishes you for the one thing the log is trying to encourage.
 */
export function journalStreak(entries: JournalEntry[]): number {
  const days = new Set(entries.filter(isWritten).map((e) => e.entry_date));
  const cursor = new Date();
  if (!days.has(dkey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dkey(cursor))) {
    streak++;
    // Calendar arithmetic, not milliseconds: subtracting a fixed 24h lands on
    // the wrong local day either side of a clock change, so a streak spanning
    // one would count a day twice or skip one.
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Deterministic rule-of-the-day, stable for a given calendar day. */
export function ruleOfDay(rules: Rule[]): Rule | null {
  const active = rules.filter((r) => r.active);
  if (!active.length) return null;
  return active[localDayIndex() % active.length];
}

/** Completed-task counts for the last `n` ISO weeks, oldest first. */
export function weekCounts(tasks: Task[], n = 8) {
  const out: { start: Date; count: number }[] = [];
  const thisWeek = monday();

  for (let i = n - 1; i >= 0; i--) {
    // Calendar arithmetic for the same reason as the streak: `i * 7 * DAY` of
    // milliseconds slips an hour across a clock change, which walks a bucket
    // boundary off local midnight and files that hour's tasks in the wrong
    // week. Reuses monday() rather than re-deriving it here.
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const count = tasks.filter((t) => {
      if (!t.completed_at) return false;
      const at = new Date(t.completed_at);
      return at >= start && at < end;
    }).length;
    out.push({ start, count });
  }
  return out;
}
