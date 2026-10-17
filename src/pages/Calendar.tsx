import { useMemo, useState } from "react";
import { ask } from "../components/Confirm";
import { EmptyState, Modal, PageHeader, btn, card, input, label } from "../components/ui";
import { useCollection } from "../hooks/useCollection";
import { formatDay, ymd } from "../lib/format";
import { WD_LONG, byTime, dateLabel, expand, hoursOf, repeatLabel, upcomingOccurrences, weekdayMon, type Occurrence } from "../lib/recurrence";
import type { CalendarEvent, Override, Recurrence } from "../types";

const COLORS = ["#2f5d8a", "#3f7d5a", "#b7791f", "#b4493d", "#6b5aa6"];
const DAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
type Draft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt" | "ownerId">;
const hours = hoursOf;

const weekFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function Calendar() {
  const { items, save, add, update, remove } = useCollection<CalendarEvent>("events");
  const [anchor, setAnchor] = useState(() => new Date()); // jour de référence des deux vues
  const [view, setView] = useState<"month" | "week">("month");
  // occurrence : date d'origine quand on ne modifie qu'une seule date d'une série
  const [editing, setEditing] = useState<{ event?: CalendarEvent; date: string; occurrence?: string } | null>(null);
  const [choosing, setChoosing] = useState<Occurrence | null>(null);
  const open = (o: Occurrence) => (o.base.recurrence ? setChoosing(o) : setEditing({ event: o.base, date: o.base.date }));
  const today = ymd(new Date());

  const cells = useMemo(() => {
    const first = view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : anchor;
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [anchor, view]);

  const byDate = useMemo(() => {
    const m = new Map<string, Occurrence[]>();
    for (const o of expand(items, ymd(cells[0]), ymd(cells[cells.length - 1])).sort(byTime)) m.set(o.date, [...(m.get(o.date) ?? []), o]);
    return m;
  }, [items, cells]);

  const upcoming = upcomingOccurrences(items, today, 8);
  const go = (n: number) =>
    setAnchor(view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() + n, 1) : new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * n));
  const nav = "rounded-md border border-line px-3 py-1.5 text-sm dark:border-night-line";
  const title = view === "month" ? monthFmt.format(anchor) : weekFmt.formatRange(cells[0], cells[6]);

  return (
    <>
      <PageHeader title="Calendrier" save={save}>
        <button className={btn} onClick={() => setEditing({ date: today })}>Nouvel événement</button>
      </PageHeader>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className={nav} onClick={() => go(-1)} aria-label={view === "month" ? "Mois précédent" : "Semaine précédente"}>←</button>
        <button className={nav} onClick={() => go(1)} aria-label={view === "month" ? "Mois suivant" : "Semaine suivante"}>→</button>
        <button className={nav} onClick={() => setAnchor(new Date())}>Aujourd'hui</button>
        <h2 className="ml-2 font-medium capitalize">{title}</h2>
        <div className="ml-auto flex rounded-md border border-line p-0.5 dark:border-night-line">
          {(["month", "week"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}
              className={`rounded px-3 py-1 text-sm ${view === v ? "bg-accent/10 text-accent dark:bg-night-accent/15 dark:text-night-accent" : "text-muted dark:text-night-muted"}`}>
              {v === "month" ? "Mois" : "Semaine"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className={`${card} grid grid-cols-7 overflow-hidden`}>
          {DAYS.map((d) => <div key={d} className="border-b border-line px-2 py-1.5 text-xs text-muted dark:border-night-line dark:text-night-muted">{d}</div>)}
          {cells.map((d) => {
            const key = ymd(d), evs = byDate.get(key) ?? [], other = d.getMonth() !== anchor.getMonth();
            return (
              <div key={key} onClick={() => setEditing({ date: key })}
                className={`min-h-20 cursor-pointer border-b border-r border-line p-1 hover:bg-paper dark:border-night-line dark:hover:bg-night ${other ? "opacity-40" : ""}`}>
                <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${key === today ? "bg-accent text-white dark:bg-night-accent dark:text-night" : ""}`}>{d.getDate()}</span>
                <div className="mt-0.5 space-y-0.5">
                  {evs.slice(0, 3).map(({ event: e, date, origDate, base }) => (
                    <button key={e.id + origDate} onClick={(ev) => { ev.stopPropagation(); open({ event: e, date, origDate, base }); }}
                      className="block w-full truncate rounded px-1 text-left text-[11px] text-white" style={{ background: e.color ?? COLORS[0] }}>
                      {e.recurrence ? "↻ " : ""}{e.endDate && date !== e.date ? "↳ " : e.startTime ? `${e.startTime} ` : ""}{e.title}
                    </button>
                  ))}
                  {evs.length > 3 && <span className="px-1 text-[11px] text-muted dark:text-night-muted">+{evs.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Semaine : 7 colonnes sur ordinateur, une ligne par jour sur téléphone */
        <div className={`${card} grid grid-cols-1 overflow-hidden sm:grid-cols-7`}>
          {cells.map((d, i) => {
            const key = ymd(d), evs = byDate.get(key) ?? [];
            return (
              <div key={key} onClick={() => setEditing({ date: key })}
                className="min-h-16 cursor-pointer border-b border-line p-2 hover:bg-paper sm:min-h-64 sm:border-r dark:border-night-line dark:hover:bg-night">
                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted dark:text-night-muted">
                  <span>{DAYS[i]}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${key === today ? "bg-accent text-white dark:bg-night-accent dark:text-night" : "text-ink dark:text-slate-100"}`}>{d.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {evs.map(({ event: e, date, origDate, base }) => (
                    <button key={e.id + origDate} onClick={(ev) => { ev.stopPropagation(); open({ event: e, date, origDate, base }); }}
                      className="block w-full rounded border-l-4 bg-paper px-2 py-1 text-left text-xs dark:bg-night" style={{ borderLeftColor: e.color ?? COLORS[0] }}>
                      {hours(e) && <span className="block text-muted dark:text-night-muted">{hours(e)}</span>}
                      <span className="font-medium">{e.endDate && date !== e.date ? "↳ " : e.recurrence ? "↻ " : ""}{e.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-2 mt-8 font-medium">Prochains événements</h2>
      {upcoming.length === 0 ? (
        <EmptyState title="Rien de prévu" hint="Cliquez sur un jour du calendrier pour ajouter un événement." />
      ) : (
        <ul className="space-y-2">
          {upcoming.map(({ event: e, date, origDate, base }) => (
            <li key={e.id + origDate}>
              <button onClick={() => open({ event: e, date, origDate, base })} className={`${card} flex w-full items-center gap-3 px-4 py-2.5 text-left`}>
                <span className="h-8 w-1 rounded" style={{ background: e.color ?? COLORS[0] }} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted dark:text-night-muted">{dateLabel(e, date)} {hours(e)}{e.recurrence ? ` · ↻ ${repeatLabel(e.recurrence)}` : ""}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {choosing && (
        <Modal title="Événement récurrent" onClose={() => setChoosing(null)}>
          <p className="mb-4 text-sm">{choosing.event.title} · {formatDay(choosing.date)}</p>
          <div className="flex flex-col gap-2">
            <button className={btn} onClick={() => { setEditing({ event: choosing.base, date: choosing.date, occurrence: choosing.origDate }); setChoosing(null); }}>Cette date uniquement</button>
            <button className="rounded-md border border-line px-3 py-2 text-sm dark:border-night-line" onClick={() => { setEditing({ event: choosing.base, date: choosing.base.date }); setChoosing(null); }}>Toute la série</button>
          </div>
        </Modal>
      )}

      {editing && (() => {
        const ev = editing.event, occ = editing.occurrence, r = ev?.recurrence;
        const withoutOverride = (o?: Record<string, Override>) => { const { [occ ?? ""]: _x, ...rest } = o ?? {}; return rest; };
        const patchSeries = (rec: Recurrence) => update(ev!.id, { recurrence: rec });
        return (
          <EventModal key={`${ev?.id ?? editing.date}-${occ ?? ""}`} event={ev} date={editing.date} occurrence={occ} onClose={() => setEditing(null)}
            onSave={async (d) => {
              if (ev && occ && r) { const { recurrence: _r, ...fields } = d; return patchSeries({ ...r, overrides: { ...r.overrides, [occ]: fields } }); }
              return ev ? update(ev.id, d) : !!(await add(d));
            }}
            onDelete={ev ? () => (occ && r ? patchSeries({ ...r, skip: [...(r.skip ?? []), occ], overrides: withoutOverride(r.overrides) }) : remove(ev.id)) : undefined}
            onRestore={ev && occ && r?.overrides?.[occ] ? () => patchSeries({ ...r, overrides: withoutOverride(r.overrides) }) : undefined} />
        );
      })()}
    </>
  );
}

function EventModal({ event, date, occurrence, onSave, onDelete, onRestore, onClose }: {
  event?: CalendarEvent; date: string; occurrence?: string; onSave: (d: Draft) => Promise<boolean>;
  onDelete?: () => Promise<boolean>; onRestore?: () => Promise<boolean>; onClose: () => void;
}) {
  // En mode « une seule date », on part de la série + les modifications déjà faites sur cette date.
  const ov = occurrence ? event?.recurrence?.overrides?.[occurrence] : undefined;
  const src = event && occurrence ? { ...event, ...ov } : event;
  const [title, setTitle] = useState(src?.title ?? "");
  const [day, setDay] = useState(occurrence ? date : (event?.date ?? date));
  const [start, setStart] = useState(src?.startTime ?? "");
  const [end, setEnd] = useState(src?.endTime ?? "");
  const [desc, setDesc] = useState(src?.description ?? "");
  const [color, setColor] = useState(src?.color ?? COLORS[0]);
  const [endDay, setEndDay] = useState(event?.endDate ?? "");
  const [repeat, setRepeat] = useState(!occurrence && Boolean(event?.recurrence));
  const [wd, setWd] = useState<number[]>(event?.recurrence?.weekdays ?? []);
  const [every, setEvery] = useState<1 | 2>(event?.recurrence?.intervalWeeks ?? 1);
  const [until, setUntil] = useState(event?.recurrence?.until ?? "");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErr("Le titre est obligatoire.");
    if (!day) return setErr("La date est obligatoire.");
    const multi = !repeat && !occurrence && endDay > day; // sur plusieurs jours
    if (endDay && !repeat && !occurrence && endDay < day) return setErr("La date de fin précède la date de début.");
    if (start && end && end < start && !multi) return setErr("L'heure de fin précède l'heure de début.");
    if (repeat && wd.length === 0) return setErr("Choisissez au moins un jour de répétition.");
    if (repeat && until && until < day) return setErr("La fin de la répétition précède la date de l'événement.");
    const recurrence = repeat ? { weekdays: [...wd].sort(), intervalWeeks: every, until: until || undefined } : undefined;
    const ok = await onSave(occurrence
      ? { title: title.trim(), date: day, startTime: start, endTime: end, description: desc.trim(), color } // "" = valeur effacée pour cette date
      : { title: title.trim(), date: day, endDate: multi ? endDay : undefined, startTime: start || undefined, endTime: end || undefined, description: desc.trim() || undefined, color, recurrence });
    if (ok) onClose(); else setErr("L'enregistrement a échoué. Vos données sont conservées dans ce formulaire.");
  };

  return (
    <Modal title={occurrence ? "Modifier cette date uniquement" : event ? "Modifier l'événement" : "Nouvel événement"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {occurrence && <p className="text-xs text-muted dark:text-night-muted">Les autres dates de la série ne sont pas modifiées.</p>}
        <div><label className={label} htmlFor="ev-t">Titre</label><input id="ev-t" autoFocus className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className={`grid gap-2 ${!repeat && !occurrence ? "grid-cols-2" : "grid-cols-1"}`}>
          <div><label className={label} htmlFor="ev-d">{occurrence ? "Date" : "Date de début"}</label><input id="ev-d" type="date" className={input} value={day} onChange={(e) => { setDay(e.target.value); if (endDay && endDay < e.target.value) setEndDay(e.target.value); }} /></div>
          {!repeat && !occurrence && (
            <div><label className={label} htmlFor="ev-ed">Date de fin (facultatif)</label><input id="ev-ed" type="date" className={input} min={day} value={endDay} onChange={(e) => setEndDay(e.target.value)} /></div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label} htmlFor="ev-s">Heure de début</label><input id="ev-s" type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label className={label} htmlFor="ev-e">Heure de fin</label><input id="ev-e" type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        {!repeat && !occurrence && endDay > day && <p className="text-xs text-muted dark:text-night-muted">Sur plusieurs jours : l'heure de début vaut pour le premier jour, l'heure de fin pour le dernier.</p>}
        <div><label className={label} htmlFor="ev-n">Description</label><textarea id="ev-n" rows={3} className={input} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="flex gap-2" role="radiogroup" aria-label="Couleur">
          {COLORS.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={`Couleur ${c}`} onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ${c === color ? "ring-2 ring-offset-2 ring-ink dark:ring-slate-200 dark:ring-offset-night-surface" : ""}`} style={{ background: c }} />
          ))}
        </div>
        {!occurrence && (
        <div className="space-y-2 rounded-md border border-line p-3 dark:border-night-line">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={repeat} onChange={(e) => { setRepeat(e.target.checked); if (e.target.checked && wd.length === 0) setWd([weekdayMon(day)]); }} />
            Répéter cet événement
          </label>
          {repeat && (
            <>
              <div className="flex gap-1" role="group" aria-label="Jours de répétition">
                {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
                  <button type="button" key={i} aria-pressed={wd.includes(i)} aria-label={WD_LONG[i]} onClick={() => setWd((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))}
                    className={`h-8 w-8 rounded-md border text-sm ${wd.includes(i) ? "border-accent bg-accent text-white dark:border-night-accent dark:bg-night-accent dark:text-night" : "border-line dark:border-night-line"}`}>{l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={label} htmlFor="ev-r">Fréquence</label>
                  <select id="ev-r" className={input} value={every} onChange={(e) => setEvery(Number(e.target.value) as 1 | 2)}>
                    <option value={1}>Chaque semaine</option><option value={2}>Toutes les 2 semaines</option>
                  </select></div>
                <div><label className={label} htmlFor="ev-u">Jusqu'au (facultatif)</label><input id="ev-u" type="date" className={input} value={until} onChange={(e) => setUntil(e.target.value)} /></div>
              </div>
            </>
          )}
          {event?.recurrence && <p className="text-xs text-muted dark:text-night-muted">Modifier ou supprimer s'applique à toute la série.</p>}
        </div>
        )}
        {err && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <div className="flex items-center gap-3">
              <button type="button" className="text-sm text-red-600 dark:text-red-400"
                onClick={async () => {
                  const msg = occurrence ? `Supprimer uniquement le ${formatDay(day)} ? Les autres dates de la série sont conservées.`
                    : event?.recurrence ? `Supprimer toute la série « ${event.title} » ?` : `Supprimer « ${event!.title} » ?`;
                  if ((await ask(msg)) && (await onDelete())) onClose();
                }}>{occurrence ? "Supprimer cette date" : event?.recurrence ? "Supprimer la série" : "Supprimer"}</button>
              {onRestore && <button type="button" className="text-sm text-muted dark:text-night-muted" onClick={async () => { if (await onRestore()) onClose(); }}>Rétablir</button>}
            </div>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm text-muted dark:text-night-muted">Annuler</button>
            <button className={btn}>Enregistrer</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
