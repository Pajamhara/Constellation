import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import AccountBar from "./AccountBar";
import Backup from "./Backup";
import Welcome from "./Welcome";

const NAV = [
  { to: "/", label: "Accueil", icon: "🏠", end: true },
  { to: "/calendrier", label: "Calendrier", icon: "📅" },
  { to: "/projets", label: "Projets", icon: "🚀" },
  { to: "/idees", label: "Idées", icon: "💡" },
];

export default function Layout() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* préférence non critique */ }
  }, [dark]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-accent/10 text-accent dark:bg-night-accent/15 dark:text-night-accent"
        : "text-muted hover:text-ink dark:text-night-muted dark:hover:text-slate-100"
    }`;

  const toggle = (
    <button onClick={() => setDark((d) => !d)} className="rounded-md px-3 py-2 text-left text-sm text-muted hover:text-ink dark:text-night-muted dark:hover:text-slate-100">
      {dark ? "☀️ Mode clair" : "🌙 Mode sombre"}
    </button>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface px-3 py-3 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:py-6 dark:border-night-line dark:bg-night-surface">
        <div className="mb-2 hidden px-3 text-sm font-semibold md:block">Constellation</div>
        <nav className="flex gap-1 overflow-x-auto pr-12 md:flex-col md:pr-0" aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}>
              <span aria-hidden>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 hidden md:block">{toggle}<Backup /></div>
      </aside>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:pb-10 md:pt-16">
        <AccountBar />
        <Welcome />
        <Outlet />
        <div className="mt-10 md:hidden">{toggle}<Backup /></div>
      </main>
    </div>
  );
}
