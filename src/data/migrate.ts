import { indexedDbStore } from "./indexedDbStore";
import { remoteStore } from "./remoteStore";
import { STORES } from "./store";

const FLAG = "local-import-done";

/** Nombre d'éléments de l'ancienne version locale (IndexedDB) pas encore importés. */
export async function localItemCount(): Promise<number> {
  try {
    if (localStorage.getItem(FLAG)) return 0;
    let n = 0;
    for (const s of STORES) n += (await indexedDbStore.list(s)).length;
    return n;
  } catch { return 0; }
}

/** Copie vers le compte connecté (sans rien supprimer en local). Relançable sans doublons. */
export async function importLocalToRemote(): Promise<number> {
  let n = 0;
  for (const s of STORES)
    for (const item of await indexedDbStore.list<{ id: string }>(s)) { await remoteStore.put(s, item); n++; }
  try { localStorage.setItem(FLAG, "1"); } catch { /* non critique */ }
  return n;
}
