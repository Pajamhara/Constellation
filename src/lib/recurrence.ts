import type { CalendarEvent, Recurrence } from "../types";
import { formatDay, ymd } from "./format";
 
/** event : version affichée (avec modifications éventuelles de la date) ; base : l'événement/série enregistré. */
export interface Occurrence { event: CalendarEvent; date: string; origDate: string; base: CalendarEvent }
export const WD_SHORT = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
export const WD_LONG = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
 
export const parseYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const weekdayMon = (s: string) => (parseYmd(s).getDay() + 6) % 7;
const nextDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const weekIndex = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  const wd = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return Math.round(Date.UTC(y, m - 1, d - wd) / 864e5 / 7); // index de la semaine (lundi), sans souci d'heure d'été
};
 
/** La date fait-elle partie de la série (avant exceptions) ? */
function inSeries(e: CalendarEvent, day: string): boolean {
  const r = e.recurrence;
  if (!r) return day === e.date;
  if (day < e.date || (r.until && day > r.until)) return false;
  if (day === e.date) return true; // le jour de départ compte toujours
  if (!r.weekdays.includes(weekdayMon(day))) return false;
  return (weekIndex(day) - weekIndex(e.date)) % r.intervalWeeks === 0;
}
 
/** Toutes les occurrences affichées entre deux dates incluses (séries, exceptions et événements simples). */
export function expand(events: CalendarEvent[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  const end = parseYmd(to);
  for (const e of events) {
    const r = e.recurrence;
    if (!r) {
      const last = e.endDate && e.endDate > e.date ? e.endDate : e.date; // dernier jour
      if (last >= from && e.date <= to) {
        const first = e.date > from ? e.date : from, stop = last < to ? last : to; // limité à la fenêtre affichée
        for (let d = parseYmd(first); ymd(d) <= stop; d = nextDay(d)) out.push({ event: e, date: ymd(d), origDate: e.date, base: e });
      }
      continue;
    }
    for (let d = parseYmd(from); d <= end; d = nextDay(d)) {
      const key = ymd(d);
      if (inSeries(e, key) && !r.skip?.includes(key) && !r.overrides?.[key]) out.push({ event: e, date: key, origDate: key, base: e });
    }
    // Dates modifiées : peuvent être déplacées vers (ou depuis) une autre fenêtre, donc traitées à part.
    for (const [orig, ov] of Object.entries(r.overrides ?? {})) {
      if (!inSeries(e, orig) || r.skip?.includes(orig)) continue;
      const date = ov.date ?? orig;
      if (date >= from && date <= to) out.push({ event: { ...e, ...ov, date }, date, origDate: orig, base: e });
    }
  }
  return out;
}
 
export const byTime = (a: Occurrence, b: Occurrence) =>
  (a.date + (a.event.startTime ?? "")).localeCompare(b.date + (b.event.startTime ?? ""));
 
/** Prochaines occurrences à partir de `from` (répétitions limitées à 90 jours d'avance). */
export function upcomingOccurrences(events: CalendarEvent[], from: string, limit: number): Occurrence[] {
  const end = parseYmd(from); end.setDate(end.getDate() + 90);
  const single = events.filter((e) => !e.recurrence && (e.endDate ?? e.date) >= from).map((event) => ({ event, date: event.date, origDate: event.date, base: event }));
  return [...single, ...expand(events.filter((e) => e.recurrence), from, ymd(end))].sort(byTime).slice(0, limit);
}
 
export const hoursOf = (e: CalendarEvent) => (e.endDate && e.endDate !== e.date ? "" : e.startTime ? e.startTime + (e.endTime ? `–${e.endTime}` : "") : "");
 
export const repeatLabel = (r: Recurrence) =>
  `${r.intervalWeeks === 2 ? "toutes les 2 semaines" : "chaque semaine"} (${r.weekdays.map((i) => WD_SHORT[i]).join(" ")})`;
 
/** « lun. 12 octobre » ou, pour un événement sur plusieurs jours, « lun. 12 octobre → mer. 14 octobre ». */
export const dateLabel = (e: CalendarEvent, date: string) =>
  e.endDate && e.endDate !== e.date ? `${formatDay(e.date)} → ${formatDay(e.endDate)}` : formatDay(date);
