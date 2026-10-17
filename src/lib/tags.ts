/** "appli, #perso , appli" -> ["appli", "perso"] (sans doublon ni dièse). */
export const parseTags = (v: string) => [...new Set(v.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean))];

/** Tags distincts avec leur nombre d'utilisations, triés par ordre alphabétique. */
export function tagCounts(lists: (string[] | undefined)[]): [string, number][] {
  const m = new Map<string, number>();
  for (const tags of lists) for (const t of tags ?? []) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
}
