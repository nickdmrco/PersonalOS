import { weekCounts } from "@/lib/model";
import type { Task } from "@/lib/types";

/** Eight weeks of completed tasks. Single series, so no legend — the panel
 *  heading names it. Endpoint emphasised; the scale is the max of the window. */
export function CoursePlot({ tasks }: { tasks: Task[] }) {
  const weeks = weekCounts(tasks, 8);
  const max = Math.max(2, ...weeks.map((w) => w.count));
  const W = 100;
  const H = 32;
  const pad = 3;

  const pts = weeks.map((w, i) => {
    const x = (i / (weeks.length - 1)) * (W - pad * 2) + pad;
    const y = H - pad - (w.count / max) * (H - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L${pts.at(-1)![0].toFixed(2)} ${H - pad} L${pts[0][0].toFixed(2)} ${H - pad} Z`;
  const [lx, ly] = pts.at(-1)!;

  return (
    <div className="plot">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Tasks completed per week over the last eight weeks. Most recent: ${weeks.at(-1)!.count}.`}
      >
        <line
          x1={pad}
          y1={H - pad}
          x2={W - pad}
          y2={H - pad}
          stroke="var(--line)"
          strokeWidth="0.6"
          fill="none"
        />
        <path d={area} fill="var(--accent-soft)" stroke="none" />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={lx} cy={ly} r="2.2" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.1" />
      </svg>
      <div className="cap">
        <span>8 weeks ago</span>
        <span>{weeks.at(-1)!.count} done this week</span>
      </div>
    </div>
  );
}
