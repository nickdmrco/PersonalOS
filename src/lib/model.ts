import { DAY, localDayIndex } from "./dates";
import type { DriftState, Goal, Rule, Task } from "./types";

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

/** Deterministic rule-of-the-day, stable for a given calendar day. */
export function ruleOfDay(rules: Rule[]): Rule | null {
  const active = rules.filter((r) => r.active);
  if (!active.length) return null;
  return active[localDayIndex() % active.length];
}

/** Completed-task counts for the last `n` ISO weeks, oldest first. */
export function weekCounts(tasks: Task[], n = 8) {
  const out: { start: Date; count: number }[] = [];
  const base = new Date();
  const mon = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));

  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(mon.getTime() - i * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const count = tasks.filter((t) => {
      if (!t.completed_at) return false;
      const at = new Date(t.completed_at);
      return at >= start && at < end;
    }).length;
    out.push({ start, count });
  }
  return out;
}
