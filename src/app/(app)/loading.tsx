/**
 * Every route here is dynamic and queries on render, so without a loading
 * state a navigation sits on the previous page for the whole trip and reads
 * as a dead click. This paints immediately and the real page streams in
 * behind it — and it gives Next something to hand back for a prefetch, which
 * otherwise has nothing to deliver for a dynamic route.
 */
export default function Loading() {
  return (
    <>
      <div className="top">
        <div>
          <div className="skel" style={{ width: 210, height: 27 }} />
          <div className="skel" style={{ width: 130, height: 10, marginTop: 8 }} />
        </div>
      </div>

      <div className="skel" style={{ height: 39, borderRadius: 8, marginBottom: 22 }} />

      <div className="grid g2">
        <div className="grid" style={{ alignContent: "start" }}>
          <section className="panel" aria-hidden="true">
            <header>
              <div className="skel" style={{ width: 120, height: 10 }} />
            </header>
            <div className="body">
              <div className="skel" style={{ height: 13, marginBottom: 10 }} />
              <div className="skel" style={{ height: 13, width: "82%", marginBottom: 10 }} />
              <div className="skel" style={{ height: 13, width: "64%" }} />
            </div>
          </section>
          <section className="panel" aria-hidden="true">
            <header>
              <div className="skel" style={{ width: 96, height: 10 }} />
            </header>
            <div className="body">
              <div className="skel" style={{ height: 13, marginBottom: 10 }} />
              <div className="skel" style={{ height: 13, width: "71%" }} />
            </div>
          </section>
        </div>

        <div className="grid" style={{ alignContent: "start" }}>
          <section className="panel" aria-hidden="true">
            <header>
              <div className="skel" style={{ width: 104, height: 10 }} />
            </header>
            <div className="body">
              <div className="skel" style={{ height: 13, marginBottom: 10 }} />
              <div className="skel" style={{ height: 13, width: "76%" }} />
            </div>
          </section>
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading
      </span>
    </>
  );
}
