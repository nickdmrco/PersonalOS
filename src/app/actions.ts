"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dkey, fmtDate, monday, qkey } from "@/lib/dates";
import { FOCUS_CAP } from "@/lib/model";

type DB = Awaited<ReturnType<typeof createClient>>;

/**
 * Open tasks currently holding a focus slot. Completing a task clears its
 * star, so only open ones can hold one. Counted server-side on every write:
 * the UI hides the star at the cap, but a page left open overnight doesn't
 * know that yet.
 */
async function focusHeld(supabase: DB) {
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .eq("focus", true);
  return count ?? 0;
}

/**
 * The signed-in user's id, from claims verified locally against the project's
 * signing key. getUser() called the auth server instead — a network round trip
 * in front of the write on every one of these, on the click path.
 *
 * The id is only ever used to stamp `user_id` on an insert, and every table's
 * RLS policy carries `with check (auth.uid() = user_id)`, so Postgres rejects
 * a row claiming someone else's id no matter what is passed here. The database
 * is what enforces ownership; this only decides whether to bounce to /login.
 */
async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function refresh() {
  // Layout-level: the nav badge depends on inbox count, so every mutation
  // can change what the shell renders.
  revalidatePath("/", "layout");
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = parseFloat(String(fd.get(k) ?? ""));
  return Number.isNaN(v) ? null : v;
};

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

/* ------------------------------------------------------------------ tasks */

export async function addTask(formData: FormData) {
  const title = str(formData, "title");
  if (!title) return;
  const { supabase, userId } = await requireUser();

  // Starring on creation is still starring, so it takes the same slot check.
  const starred =
    formData.get("focus") === "true" && (await focusHeld(supabase)) < FOCUS_CAP;

  const { error } = await supabase.from("tasks").insert({
    title,
    user_id: userId,
    goal_id: str(formData, "goal_id") || null,
    due: str(formData, "due") || null,
    focus: starred,
  });
  fail("Could not add task", error);
  refresh();
}

export async function toggleTask(formData: FormData) {
  const id = str(formData, "id");
  const done = str(formData, "done") === "true";
  if (!id) return;
  const { supabase } = await requireUser();
  // RLS restricts this to the caller's own rows; no user_id filter needed.
  const { error } = await supabase
    .from("tasks")
    .update(
      done
        ? { status: "open", completed_at: null }
        : { status: "done", completed_at: new Date().toISOString(), focus: false },
    )
    .eq("id", id);
  fail("Could not update task", error);
  refresh();
}

export async function toggleFocus(formData: FormData) {
  const id = str(formData, "id");
  const on = str(formData, "focus") === "true";
  if (!id) return;
  const { supabase } = await requireUser();

  // Unstarring is always allowed; starring is not. The star renders disabled
  // once the cap is reached, so getting here means the page was stale — send
  // back a fresh render rather than raising, and the n/3 in the panel header
  // does the explaining.
  if (!on && (await focusHeld(supabase)) >= FOCUS_CAP) {
    refresh();
    return;
  }

  const { error } = await supabase.from("tasks").update({ focus: !on }).eq("id", id);
  fail("Could not update task", error);
  refresh();
}

export async function deleteTask(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  fail("Could not delete task", error);
  refresh();
}

/* ------------------------------------------------------------------ inbox */

export async function capture(formData: FormData) {
  const text = str(formData, "text");
  if (!text) return;
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("inbox_items")
    .insert({ text, user_id: userId });
  fail("Could not capture", error);
  refresh();
}

export async function dropInboxItem(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("inbox_items").delete().eq("id", id);
  fail("Could not drop item", error);
  refresh();
}

export async function inboxToTask(formData: FormData) {
  const id = str(formData, "id");
  const text = str(formData, "text");
  if (!id || !text) return;
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("tasks")
    .insert({ title: text, user_id: userId });
  fail("Could not create task", error);
  const { error: dropped } = await supabase
    .from("inbox_items")
    .delete()
    .eq("id", id);
  fail("Task created, but the inbox item was left behind", dropped);
  refresh();
}

export async function inboxToRule(formData: FormData) {
  const id = str(formData, "id");
  const text = str(formData, "text");
  if (!id || !text) return;
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("rules").insert({
    text,
    origin: `From inbox · ${fmtDate(dkey())}`,
    user_id: userId,
  });
  fail("Could not create rule", error);
  const { error: dropped } = await supabase
    .from("inbox_items")
    .delete()
    .eq("id", id);
  fail("Rule created, but the inbox item was left behind", dropped);
  refresh();
}

export async function inboxToGoal(formData: FormData) {
  const id = str(formData, "id");
  const text = str(formData, "text");
  if (!id || !text) return;
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("goals")
    .insert({ title: text, quarter: qkey(), user_id: userId });
  fail("Could not create goal", error);
  const { error: dropped } = await supabase
    .from("inbox_items")
    .delete()
    .eq("id", id);
  fail("Goal created, but the inbox item was left behind", dropped);
  redirect("/goals");
}

/* ------------------------------------------------------------------ goals */

export async function saveGoal(formData: FormData) {
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return;
  const { supabase, userId } = await requireUser();

  // progress_updated_at is deliberately absent: it is the drift clock, and
  // rewording a goal is not evidence the goal moved. Touching it here meant
  // you could clear "Off course" by retyping the title — dodging the one
  // piece of unsolicited feedback the system gives. Only logGoalProgress and
  // a completed task count as movement; on insert the column defaults to now().
  const body = {
    title,
    done_when: str(formData, "done_when"),
    target: num(formData, "target"),
    unit: str(formData, "unit"),
    dream_id: str(formData, "dream_id") || null,
  };

  const { error } = id
    ? await supabase.from("goals").update(body).eq("id", id)
    : await supabase
        .from("goals")
        .insert({ ...body, quarter: qkey(), user_id: userId });

  fail("Could not save goal", error);
  redirect("/goals");
}

export async function logGoalProgress(formData: FormData) {
  const id = str(formData, "id");
  const current = num(formData, "current");
  if (!id || current === null) return;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("goals")
    .update({ current, progress_updated_at: new Date().toISOString() })
    .eq("id", id);
  fail("Could not log progress", error);
  refresh();
}

export async function deleteGoal(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  fail("Could not delete goal", error);
  refresh();
}

/* ----------------------------------------------------------------- dreams */

export async function saveDream(formData: FormData) {
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return;
  const { supabase, userId } = await requireUser();
  const body = { title, body: str(formData, "body") };

  const { error } = id
    ? await supabase.from("dreams").update(body).eq("id", id)
    : await supabase.from("dreams").insert({ ...body, user_id: userId });

  fail("Could not save dream", error);
  redirect("/dreams");
}

export async function deleteDream(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("dreams").delete().eq("id", id);
  fail("Could not delete dream", error);
  refresh();
}

/* ------------------------------------------------------------------ rules */

export async function saveRule(formData: FormData) {
  const id = str(formData, "id");
  const text = str(formData, "text");
  if (!text) return;
  const { supabase, userId } = await requireUser();
  const body = { text, origin: str(formData, "origin") };

  const { error } = id
    ? await supabase.from("rules").update(body).eq("id", id)
    : await supabase.from("rules").insert({ ...body, user_id: userId });

  fail("Could not save rule", error);
  redirect("/rules");
}

/** Rules are retired, not deleted — the record of what you once decided
 *  is worth more than a tidy table. The Rules page lists them, so a retired
 *  rule stays readable and can be brought back. */
export async function retireRule(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("rules").update({ active: false }).eq("id", id);
  fail("Could not retire rule", error);
  refresh();
}

export async function restoreRule(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("rules").update({ active: true }).eq("id", id);
  fail("Could not restore rule", error);
  refresh();
}

/* ---------------------------------------------------------------- journal */

export async function saveJournal(formData: FormData) {
  const entry_date = str(formData, "entry_date") || dkey();
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: userId,
      entry_date,
      entry: str(formData, "entry"),
      wins: str(formData, "wins"),
      friction: str(formData, "friction"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" },
  );
  fail("Could not save log entry", error);
  refresh();
}

/**
 * The pipeline that makes rules earned rather than declared. It hands you a
 * draft rather than filing one: friction is a complaint ("the build took
 * twenty minutes again") and a rule is an instruction ("build before standup,
 * not during it"). Writing the second from the first is the actual work, and
 * inserting the complaint verbatim skipped it.
 *
 * Only the date travels. The Rules page reads the entry itself, so nothing
 * long rides in a URL and the evidence shown beside the draft is the stored
 * one rather than a copy.
 */
export async function promoteFriction(formData: FormData) {
  const date = str(formData, "date");
  if (!date) return;
  await requireUser();
  redirect(`/rules?from=${encodeURIComponent(date)}`);
}

/* ----------------------------------------------------------------- review */

export async function finishReview(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const week_of = dkey(monday());

  // Goal values updated during the review, issued together rather than awaited
  // one at a time: this was a round trip per goal, in series, at the front of
  // the click. A quarter with five numeric goals paid all five before the rest
  // of the review had started. The builders are lazy, so nothing is sent until
  // Promise.all subscribes to them.
  const movedAt = new Date().toISOString();
  const goalUpdates = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("goalnum:")) continue;
    const current = parseFloat(String(value));
    if (Number.isNaN(current)) continue;
    goalUpdates.push(
      supabase
        .from("goals")
        .update({ current, progress_updated_at: movedAt })
        .eq("id", key.slice("goalnum:".length)),
    );
  }
  for (const { error } of await Promise.all(goalUpdates)) {
    fail("Could not update goal progress", error);
  }

  // Next week's tasks. The review is the scheduler, so its tasks get first
  // claim on Focus — but only on the slots that are actually free. Starring
  // all of them would put six starred tasks on a board that says three, which
  // is the review breaking the rule the rest of the app enforces.
  let free = Math.max(0, FOCUS_CAP - (await focusHeld(supabase)));
  const nextTasks: { title: string; goal_id: string | null; user_id: string; focus: boolean }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("nexttask:")) continue;
    const title = String(value).trim();
    if (!title) continue;
    const goalId = key.slice("nexttask:".length);
    nextTasks.push({
      title,
      goal_id: goalId === "none" ? null : goalId,
      user_id: userId,
      focus: free > 0,
    });
    if (free > 0) free--;
  }
  if (nextTasks.length) {
    const { error } = await supabase.from("tasks").insert(nextTasks);
    fail("Could not create next week's tasks", error);
  }

  // A rule written during the review, if any.
  const newrule = str(formData, "newrule");
  if (newrule) {
    const { error } = await supabase.from("rules").insert({
      text: newrule,
      origin: `Written during the weekly review · ${fmtDate(week_of)}`,
      user_id: userId,
    });
    fail("Could not save the new rule", error);
  }

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", "done")
    .gte("completed_at", monday().toISOString());

  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: userId,
      week_of,
      notes: str(formData, "notes"),
      completed_count: count ?? 0,
    },
    { onConflict: "user_id,week_of" },
  );
  fail("Could not save review", error);
  redirect("/");
}

/* ------------------------------------------------------------------- auth */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
