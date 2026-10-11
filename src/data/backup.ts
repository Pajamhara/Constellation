import { store } from "./index";
import { STORES } from "./store";

/** Télécharge toutes les données dans un fichier JSON (sauvegarde manuelle). */
export async function exportBackup() {
  const out: Record<string, unknown[]> = {};
  for (const s of STORES) out[s] = await store.list(s);
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Restaure une sauvegarde (fusion par id : rien n'est supprimé). Retourne le nombre d'éléments. */
export async function importBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as Record<string, { id: string }[]>;
  let n = 0;
  for (const s of STORES)
    for (const item of data[s] ?? []) { await store.put(s, item); n++; }
  return n;
}
