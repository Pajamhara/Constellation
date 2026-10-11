import { useEffect, useState } from "react";
import { Modal } from "./ui";

type Req = { message: string; resolve: (ok: boolean) => void };
let setReq: ((r: Req | null) => void) | null = null;

/** Remplace window.confirm : `if (await ask("Supprimer … ?")) { … }` */
export const ask = (message: string) =>
  new Promise<boolean>((resolve) => (setReq ? setReq({ message, resolve }) : resolve(window.confirm(message))));

export function ConfirmHost() {
  const [req, set] = useState<Req | null>(null);
  useEffect(() => { setReq = set; return () => { setReq = null; }; }, []);
  if (!req) return null;
  const done = (ok: boolean) => { req.resolve(ok); set(null); };
  return (
    <div className="relative z-40">
      <Modal title="Confirmation" onClose={() => done(false)}>
        <p className="text-sm">{req.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => done(false)} className="rounded-md px-3 py-2 text-sm text-muted dark:text-night-muted">Annuler</button>
          <button onClick={() => done(true)} autoFocus className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90">Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
