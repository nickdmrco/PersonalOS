import { createClient } from "@/lib/supabase/server";
import type {
  Dream,
  Goal,
  InboxItem,
  JournalEntry,
  Review,
  Rule,
  Task,
} from "./types";

/**
 * One round trip for everything the shell and most views need. RLS scopes
 * every query to the signed-in user, so none of these carry a user filter.
 */
export async function loadAll() {
  const supabase = await createClient();

  const [dreams, goals, tasks, inbox, journal, rules, reviews] =
    await Promise.all([
      supabase.from("dreams").select("*").eq("archived", false).order("created_at"),
      supabase.from("goals").select("*").order("created_at"),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("inbox_items").select("*").order("created_at", { ascending: false }),
      supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }),
      supabase.from("rules").select("*").eq("active", true).order("created_at"),
      supabase.from("reviews").select("*").order("week_of", { ascending: false }),
    ]);

  return {
    dreams: (dreams.data ?? []) as Dream[],
    goals: (goals.data ?? []) as Goal[],
    tasks: (tasks.data ?? []) as Task[],
    inbox: (inbox.data ?? []) as InboxItem[],
    journal: (journal.data ?? []) as JournalEntry[],
    rules: (rules.data ?? []) as Rule[],
    reviews: (reviews.data ?? []) as Review[],
  };
}

export type AppData = Awaited<ReturnType<typeof loadAll>>;

export async function inboxCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inbox_items")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
