import Link from "next/link";
import { deleteDream } from "@/app/actions";
import { DreamForm } from "@/components/DreamForm";
import { PageHeader } from "@/components/PageHeader";
import { loadAll } from "@/lib/data";

export default async function DreamsPage() {
  const { dreams, goals } = await loadAll();

  return (
    <>
      <PageHeader
        title="Dreams"
        meta="Read once a year · rewritten less often than that"
      />

      <div className="note" style={{ marginBottom: 16 }}>
        These are the only things allowed to be vague. A dream&rsquo;s job is to
        be the reason a goal exists — if no goal points here, the dream is
        decoration.
      </div>

      <details className="panel" style={{ marginBottom: 16 }}>
        <summary className="body" style={{ cursor: "pointer", color: "var(--accent)" }}>
          New dream
        </summary>
        <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
          <DreamForm />
        </div>
      </details>

      <section className="panel">
        <div className="body flush">
          {dreams.length === 0 ? (
            <div className="empty">
              <strong>Nothing here yet.</strong>
              Write two or three. Prose, not bullets — you&rsquo;re describing a
              life, not a deliverable.
            </div>
          ) : (
            dreams.map((d) => {
              const linked = goals.filter((g) => g.dream_id === d.id && !g.archived);
              return (
                <div className="dream" key={d.id}>
                  <h4>{d.title}</h4>
                  {d.body && <p>{d.body}</p>}
                  <div className="lk">
                    {linked.length
                      ? `${linked.length} goal${linked.length > 1 ? "s" : ""} pointing here: ${linked.map((g) => g.title).join(", ")}`
                      : "No goals point here — this one is currently inert"}
                  </div>
                  <div className="rowline" style={{ marginTop: 9 }}>
                    <Link className="btn sm" href={`/dreams/${d.id}`}>Edit</Link>
                    <form action={deleteDream}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn sm gh" type="submit">Delete</button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
