import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader, ProgressBar, card } from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { formatDate, formatDay, ymd } from "../lib/format";
import { nextTask, progressOf } from "../lib/progress";
import { hoursOf, upcomingOccurrences } from "../lib/recurrence";
import type { CalendarEvent, Idea, Project, Task } from "../types";

function Section({ title, to, link, children }: { title: string; to: string; link: string; children: ReactNode }) {
  return (
    <section className={`${card} p-4`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-medium">{title}</h2>
        <Link to={to} className="text-xs text-muted hover:text-accent dark:text-night-muted dark:hover:text-night-accent">{link} →</Link>
      </div>
      {children}
    </section>
  );
}
const Empty = ({ text }: { text: string }) => <p className="py-2 text-sm text-muted dark:text-night-muted">{text}</p>;

export default function Dashboard() {
  const events = useCollection<CalendarEvent>("events");
  const projects = useCollection<Project>("projects");
  const tasks = useCollection<Task>("tasks");
  const ideas = useCollection<Idea>("ideas");
  const all = [events, projects, tasks, ideas];
  if (all.some((c) => c.loading)) return null;

  const upcoming = upcomingOccurrences(events.items, ymd(new Date()), 5);
  const active = projects.items.filter((p) => p.status === "active").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // Projets suivis = tous sauf les simples « idées » ; un projet terminé compte pour 100 %.
  const tracked = projects.items.filter((p) => p.status !== "idea");
  const pct = (p: Project) => (p.status === "done" ? 100 : progressOf(p, tasks.items));
  const global = tracked.length ? Math.round(tracked.reduce((n, p) => n + pct(p), 0) / tracked.length) : 0;
  const done = tracked.filter((p) => p.status === "done").length;

  return (
    <>
      <PageHeader title="Accueil" save={all.find((c) => c.save.kind === "error")?.save} />
      <div className="grid gap-4 sm:grid-cols-2">
        <section className={`${card} p-4 sm:col-span-2`}>
          <h2 className="mb-3 font-medium">Progression globale</h2>
          {tracked.length === 0 ? <Empty text="Créez un projet pour suivre votre avancement." /> : (
            <>
              <div className="flex items-center gap-3"><ProgressBar value={global} /><span className="text-lg font-semibold tabular-nums">{global} %</span></div>
              <p className="mt-2 text-xs text-muted dark:text-night-muted">{tracked.length} projet(s) suivi(s) · {done} terminé(s) · {active.length} en cours</p>
            </>
          )}
        </section>

        <Section title="Événements à venir" to="/calendrier" link="Calendrier">
          {upcoming.length === 0 ? <Empty text="Rien de prévu prochainement." /> : (
            <ul className="space-y-2">
              {upcoming.map(({ event: e, date }) => (
                <li key={e.id + date} className="flex items-center gap-3">
                  <span className="h-7 w-1 rounded" style={{ background: e.color ?? "#2f5d8a" }} />
                  <span className="text-sm"><span className="block font-medium">{e.recurrence ? "↻ " : ""}{e.title}</span>
                    <span className="text-xs text-muted dark:text-night-muted">{formatDay(date)} {hoursOf(e)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Projets en cours" to="/projets" link="Projets">
          {active.length === 0 ? <Empty text="Aucun projet en cours." /> : (
            <ul className="space-y-3">
              {active.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to={`/projets/${p.id}`} className="block">
                    <span className="flex justify-between text-sm"><span className="font-medium">{p.name}</span><span className="tabular-nums text-muted dark:text-night-muted">{progressOf(p, tasks.items)} %</span></span>
                    <span className="mt-1 block"><ProgressBar value={progressOf(p, tasks.items)} /></span>
                    {nextTask(p, tasks.items) && <span className="mt-1 block truncate text-xs text-muted dark:text-night-muted">Prochaine étape : {nextTask(p, tasks.items)!.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Dernières idées" to="/idees" link="Idées">
          {ideas.items.length === 0 ? <Empty text="Aucune idée notée pour l'instant." /> : (
            <ul className="space-y-2">
              {ideas.items.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{i.title}</span>
                  <span className="shrink-0 text-xs text-muted dark:text-night-muted">{formatDate(i.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
