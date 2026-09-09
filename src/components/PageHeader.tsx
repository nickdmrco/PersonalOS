import { capture } from "@/app/actions";

export function PageHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <>
      <div className="top">
        <div>
          <h2>{title}</h2>
          <div className="meta">{meta}</div>
        </div>
      </div>
      <form action={capture} className="capture">
        <input
          name="text"
          type="text"
          autoComplete="off"
          placeholder="Capture anything — it lands in the inbox, unsorted, no decisions required"
        />
        <button className="btn pri" type="submit">
          Capture
        </button>
      </form>
    </>
  );
}
