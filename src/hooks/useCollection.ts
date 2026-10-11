import { useCallback, useEffect, useState } from "react";
import { store } from "../data";
import type { StoreName } from "../data/store";
import { newId, nowIso } from "../lib/format";

export type SaveState = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };
type Entity = { id: string; createdAt: string; updatedAt: string; ownerId: string };

export function useCollection<T extends Entity>(name: StoreName) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  useEffect(() => {
    store.list<T>(name)
      .then((all) => setItems(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch((e: Error) => setSave({ kind: "error", message: e.message }))
      .finally(() => setLoading(false));
  }, [name]);

  const guard = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    try { await fn(); setSave({ kind: "saved" }); return true; }
    catch (e) { setSave({ kind: "error", message: (e as Error).message }); return false; }
  }, []);

  // L'état local n'est mis à jour qu'APRÈS la réussite de l'écriture.
  const add = async (data: Omit<T, keyof Entity>): Promise<T | undefined> => {
    let created: T | undefined;
    await guard(async () => {
      const item = { ...data, id: newId(), createdAt: nowIso(), updatedAt: nowIso(), ownerId: "" } as unknown as T;
      await store.put(name, item);
      setItems((prev) => [item, ...prev]);
      created = item;
    });
    return created;
  };

  const update = (id: string, patch: Partial<T>) => guard(async () => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const next = { ...current, ...patch, updatedAt: nowIso() };
    await store.put(name, next);
    setItems((prev) => prev.map((i) => (i.id === id ? next : i)));
  });

  const remove = (id: string) => guard(async () => {
    await store.remove(name, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  });

  return { items, loading, save, add, update, remove };
}
