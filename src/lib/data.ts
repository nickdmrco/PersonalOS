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

export type AppData = {
  dreams: Dream[];
  goals: Goal[];
  tasks: Task[];
  inbox: InboxItem[];
  journal: JournalEntry[];
  rules: Rule[];
  retired: Rule[];
  reviews: Review[];
};

type Table = keyof AppData;
type DB = Awaited<ReturnType<typeof createClient>>;

const QUERIES: Record<Table, (sb: DB) => PromiseLike<{ data: unknown }>> = {
  dreams: (sb) =>
    sb.from("dreams").select("*").eq("archived", false).order("created_at"),
  goals: (sb) => sb.from("goals").select("*").order("created_at"),
  tasks: (sb) =>
    sb.from("tasks").select("*").order("created_at", { ascending: false }),
  inbox: (sb) =>
    sb.from("inbox_items").select("*").order("created_at", { ascending: false }),
  journal: (sb) =>
    sb
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false }),
  rules: (sb) =>
    sb.from("rules").select("*").eq("active", true).order("created_at"),
  // Kept separate from `rules` so the rule of the day and its numbering keep
  // counting only what is in force.
  retired: (sb) =>
    sb.from("rules").select("*").eq("active", false).order("created_at"),
  reviews: (sb) =>
    sb.from("reviews").select("*").order("week_of", { ascending: false }),
};

/**
 * Fetch just the tables a view needs, in one parallel round trip. RLS scopes
 * every query to the signed-in user, so none of these carry a user filter.
 */
export async function load<K extends Table>(
  ...keys: K[]
): Promise<Pick<AppData, K>> {
  const supabase = await createClient();
  const results = await Promise.all(keys.map((k) => QUERIES[k](supabase)));
  return Object.fromEntries(
    keys.map((k, i) => [k, results[i].data ?? []]),
  ) as Pick<AppData, K>;
}

export async function inboxCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inbox_items")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
