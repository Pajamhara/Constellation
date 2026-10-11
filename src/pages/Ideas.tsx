import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ask } from "../components/Confirm";
import { EmptyState, Modal, PageHeader, btn, card, input, label } from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { formatDate } from "../lib/format";
import type { Idea, Priority, Project } from "../types";

const PRIO: Record<Priority, string> = { low: "Basse", medium: "Moyenne", high: "Élevée" };
type Filter = "all" | "recent" | "high";
const small = "rounded-md border border-line px-2.5 py-1 text-xs dark:border-night-line";

export default function Ideas() {
  const ideas = useCollection<Idea>("ideas");
  const projects = useCollection<Project>("projects");
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Idea | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const save = projects.save.kind === "error" ? projects.save : ideas.save;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (t && (await ideas.add({ title: t, description: "", notes: "", tags: [] }))) setTitle("");
  };

  // Crée le projet à partir de l'idée, puis marque l'idée comme convertie (elle n'est jamais supprimée).
  const convert = async (i: Idea) => {
    if (busy) return;
    setBusy(i.id);
    const p = await projects.add({ name: i.title, description: i.description, status: "todo", progressMode: "auto", manualProgress: 0, notes: i.notes });
    if (p && (await ideas.update(i.id, { convertedProjectId: p.id }))) navigate(`/projets/${p.id}`);
    setBusy(null);
  };

  const since = Date.now() - 30 * 864e5;
  const list = ideas.items.filter((i) => filter === "all" || (filter === "high" ? i.priority === "high" : new Date(i.createdAt).getTime() >= since));

  return (
    <>
      <PageHeader title="Idées" save={save} />
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Une nouvelle idée…" aria-label="Titre de l'idée" />
        <button className={btn}>Ajouter</button>
      </form>
      <select className={`${input} mb-4 w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filtrer les idées">
        <option value="all">Toutes</option><option value="recent">Récentes (30 jours)</option><option value="high">Priorité élevée</option>
      </select>

      {ideas.loading ? null : list.length === 0 ? (
        <EmptyState title={ideas.items.length ? "Aucune idée dans ce filtre" : "Aucune idée pour l'instant"} hint="Notez-en une : une ligne suffit, vous la développerez plus tard." />
      ) : (
        <ul className="space-y-2">
          {list.map((i) => (
            <li key={i.id} className={`${card} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{i.title}</p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {i.convertedProjectId && <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Converti en projet</span>}
                  {i.priority && <span className="rounded bg-paper px-2 py-0.5 dark:bg-night">Priorité {PRIO[i.priority].toLowerCase()}</span>}
                  {i.tags.map((t) => <span key={t} className="rounded bg-paper px-2 py-0.5 dark:bg-night">#{t}</span>)}
                </div>
              </div>
              {i.description && <p className="mt-1 line-clamp-2 text-sm text-muted dark:text-night-muted">{i.description}</p>}
              <p className="mt-1 text-xs text-muted dark:text-night-muted">Ajoutée le {formatDate(i.createdAt)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {i.convertedProjectId
                  ? <Link to={`/projets/${i.convertedProjectId}`} className={small}>Voir le projet →</Link>
                  : <button className={`${btn} !px-2.5 !py-1 text-xs`} disabled={busy === i.id} onClick={() => convert(i)}>{busy === i.id ? "Conversion…" : "Convertir en projet"}</button>}
                <button className={small} onClick={() => setEditing(i)}>Modifier</button>
                <button className="px-2 text-xs text-muted hover:text-red-600 dark:text-night-muted" onClick={async () => (await ask(`Supprimer l'idée « ${i.title} » ?`)) && ideas.remove(i.id)}>Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <IdeaModal key={editing.id} idea={editing} onClose={() => setEditing(null)} onSave={(patch) => ideas.update(editing.id, patch)} />}
    </>
  );
}

function IdeaModal({ idea, onSave, onClose }: { idea: Idea; onSave: (p: Partial<Idea>) => Promise<boolean>; onClose: () => void }) {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description);
  const [notes, setNotes] = useState(idea.notes);
  const [priority, setPriority] = useState<Priority | "">(idea.priority ?? "");
  const [tags, setTags] = useState(idea.tags.join(", "));
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr("Le titre est obligatoire.");
    const ok = await onSave({
      title: title.trim(), description, notes, priority: priority || undefined,
      tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
    });
    if (ok) onClose(); else setErr("L'enregistrement a échoué. Vos modifications sont conservées dans ce formulaire.");
  };

  return (
    <Modal title="Modifier l'idée" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className={label} htmlFor="id-t">Titre</label><input id="id-t" autoFocus className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className={label} htmlFor="id-d">Description</label><textarea id="id-d" rows={3} className={input} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><label className={label} htmlFor="id-n">Notes</label><textarea id="id-n" rows={3} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label} htmlFor="id-p">Priorité</label>
            <select id="id-p" className={input} value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")}>
              <option value="">Aucune</option>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div><label className={label} htmlFor="id-g">Tags (séparés par des virgules)</label><input id="id-g" className={input} value={tags} onChange={(e) => setTags(e.target.value)} /></div>
        </div>
        {err && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm text-muted dark:text-night-muted">Annuler</button>
          <button className={btn}>Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
