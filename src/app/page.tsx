import { createClient } from "@/lib/supabase/server";
import { addTask, toggleTask, deleteTask, signOut } from "./actions";

type Task = {
  id: string;
  title: string;
  status: "open" | "done";
  completed_at: string | null;
};

function weekAgoISO() {
  return new Date(Date.now() - 7 * 86400000).toISOString();
}

function ago(iso: string | null) {
  if (!iso) return "";
  const n = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 86400000),
  );
  return n === 0 ? "today" : n === 1 ? "yesterday" : `${n}d ago`;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekAgo = weekAgoISO();

  const { data: open } = await supabase
    .from("tasks")
    .select("id,title,status,completed_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: done } = await supabase
    .from("tasks")
    .select("id,title,status,completed_at")
    .eq("status", "done")
    .gte("completed_at", weekAgo)
    .order("completed_at", { ascending: false });

  const openTasks = (open ?? []) as Task[];
  const doneTasks = (done ?? []) as Task[];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Dead Reckoning
          </h1>
          <p className="label mt-1">Thin slice · tasks only</p>
        </div>
        <form action={signOut}>
          <button
            className="text-xs underline underline-offset-4"
            style={{ color: "var(--ink-3)" }}
          >
            Sign out {user?.email}
          </button>
        </form>
      </header>

      <form action={addTask} className="mt-8 flex gap-2">
        <input
          name="title"
          placeholder="Capture anything"
          autoComplete="off"
          className="flex-1 rounded-md px-3 py-2 text-sm"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
        <button
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          Add
        </button>
      </form>

      <Section title="Open" count={openTasks.length}>
        {openTasks.length === 0 ? (
          <Empty>Nothing open. Capture something above.</Empty>
        ) : (
          openTasks.map((t) => <Row key={t.id} task={t} />)
        )}
      </Section>

      {doneTasks.length > 0 && (
        <Section
          title="Completed · last 7 days"
          count={doneTasks.length}
          hint="click to undo"
        >
          {doneTasks.map((t) => (
            <Row key={t.id} task={t} />
          ))}
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mt-6 rounded-lg overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <h2 className="label">{title}</h2>
        <span className="font-mono-ui text-[11px]" style={{ color: "var(--ink-3)" }}>
          {count}
          {hint ? ` · ${hint}` : ""}
        </span>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-3)" }}>
      {children}
    </p>
  );
}

function Row({ task }: { task: Task }) {
  const done = task.status === "done";
  return (
    <div
      className="flex items-start gap-3 px-4 py-2.5"
      style={{ borderBottom: "1px solid var(--line)" }}
    >
      <form action={toggleTask} className="pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="done" value={String(done)} />
        <button
          type="submit"
          aria-label={done ? "Mark as open" : "Mark as done"}
          className="grid h-4 w-4 place-items-center rounded"
          style={{
            border: `1.5px solid ${done ? "var(--ok)" : "var(--line-2)"}`,
            background: done ? "var(--ok)" : "transparent",
          }}
        >
          {done && (
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
              <path
                d="M1 5l2.6 2.6L9 2"
                stroke="var(--surface)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <div
          className="text-sm break-words"
          style={{
            color: done ? "var(--ink-3)" : "var(--ink)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        {done && (
          <div className="font-mono-ui text-[10px]" style={{ color: "var(--ink-3)" }}>
            done {ago(task.completed_at)}
          </div>
        )}
      </div>

      <form action={deleteTask}>
        <input type="hidden" name="id" value={task.id} />
        <button
          className="text-xs"
          style={{ color: "var(--ink-3)" }}
          aria-label="Delete task"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
