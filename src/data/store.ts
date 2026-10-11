export const STORES = ["events", "projects", "tasks", "ideas"] as const;
export type StoreName = (typeof STORES)[number];

/**
 * Contrat d'accès aux données. Pour passer à une base distante (Supabase,
 * API Hono + Postgres…), il suffit d'écrire une autre classe qui l'implémente
 * et de la brancher dans data/index.ts : aucune page ni composant ne change.
 */
export interface DataStore {
  list<T>(store: StoreName): Promise<T[]>;
  put<T extends { id: string }>(store: StoreName, item: T): Promise<void>;
  remove(store: StoreName, id: string): Promise<void>;
}
