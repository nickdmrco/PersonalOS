export const DAY = 86_400_000;

/** Local-calendar date key, YYYY-MM-DD. */
export function dkey(d: Date = new Date()): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday of the week containing `d`, at local midnight. */
export function monday(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function quarterOf(d: Date = new Date()): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

export function qkey(d: Date = new Date()): string {
  return `${d.getFullYear()}-Q${quarterOf(d)}`;
}

export function qBounds(d: Date = new Date()): [Date, Date] {
  const q = quarterOf(d);
  return [new Date(d.getFullYear(), (q - 1) * 3, 1), new Date(d.getFullYear(), q * 3, 0)];
}

/** Days since the epoch on the local calendar, so it turns over at midnight. */
export function localDayIndex(d: Date = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / DAY);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

export function fmtDate(k: string): string {
  return parseKey(k).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const n = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / DAY));
  return n === 0 ? "today" : n === 1 ? "yesterday" : `${n}d ago`;
}
