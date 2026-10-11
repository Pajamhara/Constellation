import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ask } from "../components/Confirm";
import { AutoText, EmptyState, PageHeader, ProgressBar, SaveStatus, btn, card, input, label } from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { formatDate, formatDateTime } from "../lib/format";
import { STATUS_LABEL, progressOf, tasksOf } from "../lib/progress";
import type { Project, ProjectStatus, Task } from "../types";

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const projects = useCollection<Project>("projects");
  const tasks = useCollection<Task>("tasks");
  const [newTask, setNewTask] = useState("");
  const [manual, setManual] = useState<number | null>(null);

  if (projects.loading || tasks.loading) return null;
  const p = projects.items.find((x) => x.id === id);
  if (!p) return (
    <>
      <PageHeader title="Projet introuvable" />
      <EmptyState title="Ce projet n'existe plus" hint="Retournez à la liste pour en choisir un autre." />
      <Link to="/projets" className="mt-4 inline-block text-sm underline">← Tous les projets</Link>
    </>
  );

  const own = tasksOf(p, tasks.items);
  const pct = progressOf(p, tasks.items);
  const set = (patch: Partial<Project>) =>
    projects.update(p.id, patch.status ? { ...patch, completedAt: patch.status === "done" ? new Date().toISOString() : undefined } : patch);
  const touch = () => projects.update(p.id, {}); // met à jour « dernière modification »
  const save = projects.save.kind === "error" ? projects.save : tasks.save.kind === "idle" ? projects.save : tasks.save;

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const t = await tasks.add({ projectId: p.id, title: newTask.trim(), done: false, position: own.length ? own[own.length - 1].position + 1 : 0 });
    if (t) { setNewTask(""); touch(); }
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = own[i], b = own[i + dir];
    if (!b) return;
    await tasks.update(a.id, { position: b.position });
    await tasks.update(b.id, { position: a.position });
    touch();
  };
  const removeProject = async () => {
    if (!(await ask(`Supprimer le projet « ${p.name} » et ses ${own.length} étape(s) ?`))) return;
    for (const t of own) if (!(await tasks.remove(t.id))) return;
    if (await projects.remove(p.id)) navigate("/projets");
  };

  const quick = "rounded-md border border-line px-3 py-1.5 text-sm dark:border-night-line";

  return (
    <>
      <Link to="/projets" className="mb-3 inline-block text-sm text-muted dark:text-night-muted">← Tous les projets</Link>
      <PageHeader title={p.name} save={save}><SaveStatus state={{ kind: "idle" }} /></PageHeader>

      <div className="space-y-5">
        <div><label className={label}>Nom</label><AutoText ariaLabel="Nom" required value={p.name} onCommit={(v) => set({ name: v.trim() })} /></div>
        <div><label className={label}>Description</label><AutoText ariaLabel="Description" multiline value={p.description} onCommit={(v) => set({ description: v })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="st">Statut</label>
            <select id="st" className={input} value={p.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className={label}>Objectif</label><AutoText ariaLabel="Objectif" value={p.goal ?? ""} onCommit={(v) => set({ goal: v })} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.status === "paused"
            ? <button className={quick} onClick={() => set({ status: "active" })}>Reprendre</button>
            : <button className={quick} onClick={() => set({ status: "paused" })}>Mettre en pause</button>}
          {p.status !== "done" && <button className={quick} onClick={() => set({ status: "done" })}>Marquer comme terminé</button>}
        </div>

        <section className={`${card} p-4`}>
          <div className="mb-2 flex items-center gap-3"><ProgressBar value={manual ?? pct} /><span className="text-sm tabular-nums">{manual ?? pct} %</span></div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5"><input type="radio" checked={p.progressMode === "auto"} onChange={() => set({ progressMode: "auto" })} /> Calculée d'après les étapes</label>
            <label className="flex items-center gap-1.5"><input type="radio" checked={p.progressMode === "manual"} onChange={() => set({ progressMode: "manual" })} /> Manuelle</label>
          </div>
          {p.progressMode === "manual" && (
            <input type="range" min={0} max={100} step={5} className="mt-3 w-full" aria-label="Progression" value={manual ?? p.manualProgress}
              onChange={(e) => setManual(Number(e.target.value))}
              onPointerUp={() => { if (manual !== null) set({ manualProgress: manual }).then(() => setManual(null)); }}
              onKeyUp={() => { if (manual !== null) set({ manualProgress: manual }).then(() => setManual(null)); }} />
          )}
        </section>

        <section>
          <h2 className="mb-2 font-medium">Étapes <span className="text-sm font-normal text-muted dark:text-night-muted">{own.filter((t) => t.done).length}/{own.length}</span></h2>
          <form onSubmit={addTask} className="mb-3 flex gap-2">
            <input className={input} value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Ajouter une étape…" aria-label="Nouvelle étape" />
            <button className={btn}>Ajouter</button>
          </form>
          {own.length === 0 ? <EmptyState title="Aucune étape" hint="Découpez le projet en petites étapes : la progression se calculera toute seule." /> : (
            <ul className="space-y-1.5">
              {own.map((t, i) => (
                <li key={t.id} className={`${card} flex items-center gap-2 px-3 py-1.5`}>
                  <input type="checkbox" checked={t.done} aria-label={`Terminée : ${t.title}`} onChange={async () => { if (await tasks.update(t.id, { done: !t.done })) touch(); }} />
                  <AutoText ariaLabel="Titre de l'étape" required className={`border-transparent bg-transparent ${t.done ? "line-through opacity-60" : ""}`} value={t.title}
                    onCommit={async (v) => { if (await tasks.update(t.id, { title: v.trim() })) touch(); }} />
                  <button className="px-1 text-muted disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter">↑</button>
                  <button className="px-1 text-muted disabled:opacity-30" disabled={i === own.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
                  <button className="px-1 text-muted hover:text-red-600" aria-label="Supprimer l'étape" onClick={async () => { if (await tasks.remove(t.id)) touch(); }}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div><label className={label}>Notes</label><AutoText ariaLabel="Notes" multiline value={p.notes} onCommit={(v) => set({ notes: v })} /></div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted dark:border-night-line dark:text-night-muted">
          <span>Créé le {formatDate(p.createdAt)} · modifié le {formatDateTime(p.updatedAt)}</span>
          <button className="text-sm text-red-600 dark:text-red-400" onClick={removeProject}>Supprimer le projet</button>
        </footer>
      </div>
    </>
  );
}
