import { supabase } from "./supabaseClient";
import type { DataStore, StoreName } from "./store";

const table = (s: StoreName) => `app_${s}`;

function client() {
  if (!supabase) throw new Error("Base de données non configurée.");
  return supabase;
}

async function userId(): Promise<string> {
  const { data } = await client().auth.getSession();
  if (!data.session) throw new Error("Session expirée. Reconnectez-vous.");
  return data.session.user.id;
}

const fail = (msg: string, detail: string) => new Error(`${msg} (${detail})`);

export const remoteStore: DataStore = {
  async list<T>(store: StoreName) {
    const { data, error } = await client().from(table(store)).select("data");
    if (error) throw fail("Impossible de charger les données.", error.message);
    return (data ?? []).map((r) => r.data as T);
  },
  async put(store, item) {
    const owner_id = await userId();
    const { error } = await client()
      .from(table(store))
      .upsert({ id: item.id, owner_id, data: { ...item, ownerId: owner_id }, updated_at: new Date().toISOString() });
    if (error) throw fail("L'enregistrement a échoué.", error.message);
  },
  async remove(store, id) {
    const { error } = await client().from(table(store)).delete().eq("id", id);
    if (error) throw fail("La suppression a échoué.", error.message);
  },
};
