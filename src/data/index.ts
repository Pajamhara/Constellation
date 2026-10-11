import { remoteStore } from "./remoteStore";
import type { DataStore } from "./store";

// Toutes les données vivent dans Supabase (Postgres), séparées par utilisateur (RLS).
export const store: DataStore = remoteStore;
