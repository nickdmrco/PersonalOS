"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VIEWS = [
  { href: "/", name: "Today", cad: "Daily" },
  { href: "/inbox", name: "Inbox", cad: "Capture" },
  { href: "/log", name: "Log", cad: "Daily" },
  { href: "/review", name: "Review", cad: "Weekly" },
  { href: "/goals", name: "Goals", cad: "Quarterly" },
  { href: "/dreams", name: "Dreams", cad: "Yearly" },
  { href: "/rules", name: "Rules", cad: "Standing" },
];

export function Nav({ inboxCount }: { inboxCount: number }) {
  const path = usePathname();

  return (
    <nav className="nav">
      <div className="nav-h">Fastest first</div>
      {VIEWS.map((v) => {
        const on = v.href === "/" ? path === "/" : path.startsWith(v.href);
        return (
          <Link key={v.href} href={v.href} className={on ? "on" : ""}>
            <span className="nm">{v.name}</span>
            {v.href === "/inbox" && inboxCount > 0 && (
              <span className="badge">{inboxCount}</span>
            )}
            <span className="cad">{v.cad}</span>
          </Link>
        );
      })}
    </nav>
  );
}
