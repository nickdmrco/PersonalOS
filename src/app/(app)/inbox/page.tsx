import { dropInboxItem, inboxToGoal, inboxToRule, inboxToTask } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { load } from "@/lib/data";
import { ago } from "@/lib/dates";

export default async function InboxPage() {
  const { inbox } = await load("inbox");

  return (
    <>
      <PageHeader title="Inbox" meta="Capture is free · sorting is the work" />

      <div className="note" style={{ marginBottom: 16 }}>
        The dumping ground is fine — as long as it has an exit. Every item leaves
        as a <b>task</b>, a <b>goal</b>, a <b>rule</b>, or nothing at all.
      </div>

      <section className="panel">
        <header>
          <h3>Unsorted</h3>
          <span className="num">{inbox.length}</span>
        </header>
        <div className="body flush">
          {inbox.length === 0 ? (
            <div className="empty">
              <strong>Inbox empty.</strong>
              That is the correct steady state, not a sign you aren&rsquo;t doing
              enough.
            </div>
          ) : (
            inbox.map((item) => (
              <div className="inb" key={item.id}>
                <div className="tx">
                  {item.text}
                  <div className="num" style={{ color: "var(--ink-3)", marginTop: 3 }}>
                    {ago(item.created_at)}
                  </div>
                </div>
                <div className="rowline">
                  <form action={inboxToTask}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="text" value={item.text} />
                    <button className="btn sm" type="submit">Task</button>
                  </form>
                  <form action={inboxToGoal}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="text" value={item.text} />
                    <button className="btn sm" type="submit">Goal</button>
                  </form>
                  <form action={inboxToRule}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="text" value={item.text} />
                    <button className="btn sm" type="submit">Rule</button>
                  </form>
                  <form action={dropInboxItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="btn sm gh" type="submit">Drop</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
