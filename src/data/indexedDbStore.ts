import { STORES, type DataStore, type StoreName } from "./store";

const DB_NAME = "tableau-de-bord";
const DB_VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const s of STORES)
        if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("Impossible d'ouvrir la base locale du navigateur."));
  });
}

// La promesse n'est résolue qu'à la fin de la transaction : jamais de faux « enregistré ».
async function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
    tx.onerror = tx.onabort = () => reject(new Error("L'enregistrement a échoué. Vos données n'ont pas été modifiées."));
  });
}

export const indexedDbStore: DataStore = {
  list: <T,>(store: StoreName) => run<T[]>(store, "readonly", (s) => s.getAll()),
  put: (store, item) => run<void>(store, "readwrite", (s) => { s.put(item); }),
  remove: (store, id) => run<void>(store, "readwrite", (s) => { s.delete(id); }),
};
