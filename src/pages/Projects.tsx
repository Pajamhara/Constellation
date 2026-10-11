import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState, PageHeader, ProgressBar, btn, card, input } from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { formatDate, formatDateTime } from "../lib/format";
import { STATUS_LABEL, progressOf } from "../lib/progress";
import type { Project, ProjectStatus, Task } from "../types";

type Filter = Exclude<ProjectStatus, "done"> | "all";

export default function Projects() {
  const projects = useCollection<Project>("projects");
  const tasks = useCollection<Task>("tasks");
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = await projects.add({ name: name.trim(), description: "", status: "todo", progressMode: "auto", manualProgress: 0, notes: "" });
    if (p) navigate(`/projets/${p.id}`);
  };

  const sorted = [...projects.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const current = sorted.filter((p) => p.status !== "done" && (filter === "all" || p.status === filter));
  const archived = sorted.filter((p) => p.status === "done").sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt));
  const small = "shrink-0 rounded-md border border-line px-2.5 py-1 text-xs dark:border-night-line";

  return (
    <>
      <PageHeader title="Projets" save={projects.save} />
      <form onSubmit={create} className="mb-4 flex gap-2">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du nouveau projet…" aria-label="Nom du projet" />
        <button className={btn}>Créer</button>
      </form>
      <select className={`${input} mb-4 w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filtrer par statut">
        <option value="all">Tous les projets en cours</option>
        {Object.entries(STATUS_LABEL).filter(([k]) => k !== "done").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      {projects.loading ? null : current.length === 0 ? (
        <EmptyState title={projects.items.length === 0 ? "Aucun projet" : "Aucun projet dans cette vue"}
          hint={projects.items.length === 0 ? "Donnez un nom à votre premier projet ci-dessus, vous ajouterez les étapes ensuite." : "Les projets terminés se trouvent dans l'archive ci-dessous."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {current.map((p) => {
            const own = tasks.items.filter((t) => t.projectId === p.id);
            const pct = progressOf(p, tasks.items);
            return (
              <Link key={p.id} to={`/projets/${p.id}`} className={`${card} block p-4 hover:border-accent dark:hover:border-night-accent`}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium">{p.name}</h2>
                  <span className="shrink-0 rounded bg-paper px-2 py-0.5 text-xs dark:bg-night">{STATUS_LABEL[p.status]}</span>
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted dark:text-night-muted">{p.description}</p>}
                <div className="mt-3 flex items-center gap-3"><ProgressBar value={pct} /><span className="text-xs tabular-nums">{pct} %</span></div>
                <p className="mt-2 text-xs text-muted dark:text-night-muted">
                  {own.filter((t) => t.done).length}/{own.length} étapes · modifié le {formatDateTime(p.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-8" open={current.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">Projets terminés ({archived.length})</summary>
          <ul className="mt-3 space-y-2">
            {archived.map((p) => (
              <li key={p.id} className={`${card} flex items-center justify-between gap-3 px-4 py-2.5`}>
                <Link to={`/projets/${p.id}`} className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="text-xs text-muted dark:text-night-muted">
                    Terminé le {formatDate(p.completedAt ?? p.updatedAt)} · {tasks.items.filter((t) => t.projectId === p.id).length} étape(s)
                  </span>
                </Link>
                <button className={small} onClick={() => projects.update(p.id, { status: "active", completedAt: undefined })}>Rouvrir</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
