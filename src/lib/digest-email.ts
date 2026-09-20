import { fmtDate } from "./dates";
import type { Digest } from "./digest";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Deliberately plain: inline styles, system fonts, light ground. Mail clients
 * strip stylesheets, ignore custom fonts and mangle dark mode, so none of the
 * app's own typography survives the trip and pretending otherwise just breaks
 * differently in each client.
 *
 * The email carries the harvest rather than a link to it. A reminder that says
 * "time for your review" is worth reading once; a summary of the week is worth
 * reading every time, and it does the gathering step so starting is cheaper.
 */
export function renderDigestEmail(d: Digest, appUrl: string) {
  const n = d.completed.length;
  const subject =
    n > 0
      ? `Week of ${fmtDate(d.weekOf)} — ${n} task${n === 1 ? "" : "s"} completed`
      : `Week of ${fmtDate(d.weekOf)} — ready to review`;

  const lines: string[] = [];
  const text: string[] = [`Week of ${fmtDate(d.weekOf)}`, ""];

  lines.push(
    `<p style="margin:0 0 4px;font:600 21px/1.3 Georgia,serif;color:#141e1b">Week of ${fmtDate(d.weekOf)}</p>`,
    `<p style="margin:0 0 22px;font:13px/1.5 -apple-system,Segoe UI,sans-serif;color:#6f827b">${n} completed · ${d.daysLogged} day${d.daysLogged === 1 ? "" : "s"} logged</p>`,
  );
  text.push(`${n} completed, ${d.daysLogged} days logged`, "");

  const h = (t: string) =>
    `<p style="margin:22px 0 8px;font:600 10px/1 -apple-system,Segoe UI,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#6f827b">${t}</p>`;
  const ul = (items: string[]) =>
    `<ul style="margin:0;padding-left:18px;font:14px/1.7 -apple-system,Segoe UI,sans-serif;color:#141e1b">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

  if (d.completed.length) {
    lines.push(h("What got done"), ul(d.completed.map(esc)));
    text.push("WHAT GOT DONE", ...d.completed.map((c) => `  - ${c}`), "");
  }

  if (d.goals.length) {
    lines.push(
      h("Where the goals stand"),
      ul(
        d.goals.map(
          (g) =>
            `${esc(g.title)} — <span style="color:#6f827b">${esc(g.progress)}</span>` +
            (g.state === "ok"
              ? ""
              : ` <b style="color:${g.state === "bad" ? "#a33128" : "#8f620e"}">${g.drift}, ${g.days} days</b>`),
        ),
      ),
    );
    text.push(
      "WHERE THE GOALS STAND",
      ...d.goals.map(
        (g) => `  - ${g.title} — ${g.progress}${g.state === "ok" ? "" : ` (${g.drift}, ${g.days} days)`}`,
      ),
      "",
    );
  }

  if (d.frictions.length) {
    lines.push(
      h("Friction you logged"),
      ul(d.frictions.map((f) => `<span style="color:#6f827b">${fmtDate(f.date)}</span> — ${esc(f.text)}`)),
      `<p style="margin:8px 0 0;font:13px/1.5 -apple-system,Segoe UI,sans-serif;color:#6f827b">Anything here for the second time has earned a rule.</p>`,
    );
    text.push(
      "FRICTION YOU LOGGED",
      ...d.frictions.map((f) => `  - ${fmtDate(f.date)} — ${f.text}`),
      "  Anything here for the second time has earned a rule.",
      "",
    );
  } else {
    lines.push(
      h("Friction you logged"),
      `<p style="margin:0;font:14px/1.6 -apple-system,Segoe UI,sans-serif;color:#6f827b">Nothing this week — either a clean run, or it didn&rsquo;t get written down.</p>`,
    );
    text.push("FRICTION YOU LOGGED", "  Nothing this week.", "");
  }

  lines.push(
    `<p style="margin:26px 0 0"><a href="${appUrl}/review" style="display:inline-block;background:#a62e68;color:#fff;text-decoration:none;font:600 14px/1 -apple-system,Segoe UI,sans-serif;padding:12px 18px;border-radius:6px">Run the review</a></p>`,
    `<p style="margin:26px 0 0;font:11px/1.5 -apple-system,Segoe UI,sans-serif;color:#9aa8a2">Dead Reckoning · sent because this week has no review yet</p>`,
  );
  text.push(`Run the review: ${appUrl}/review`, "", "Sent because this week has no review yet.");

  const html = `<div style="background:#eff2ee;padding:28px"><div style="max-width:560px;margin:0 auto;background:#fafcf9;border:1px solid #d3dad3;border-radius:10px;padding:26px 28px">${lines.join("")}</div></div>`;

  return { subject, html, text: text.join("\n") };
}
