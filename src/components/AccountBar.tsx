import { useEffect, useRef, useState } from "react";
import { importLocalToRemote, localItemCount } from "../data/migrate";
import { supabase } from "../data/supabaseClient";
import { btn, card } from "./ui";

export default function AccountBar() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? ""));
    localItemCount().then(setPending);
  }, []);

  if (!supabase) return null;

  const run = async () => {
    setMsg("Import en cours…");
    try {
      const n = await importLocalToRemote();
      setMsg(`${n} élément(s) importé(s). Rechargez la page pour les voir.`);
      setPending(0);
    } catch (e) { setMsg(`Import interrompu : ${(e as Error).message}`); }
  };

  return (
    <>
      {/* Coin supérieur droit de la fenêtre */}
      <div className="fixed right-3 top-3 z-30"><AccountMenu email={email} /></div>
      {(pending > 0 || msg) && (
        <div className="mb-6 space-y-2 text-sm">
          {pending > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3 dark:border-night-line">
              <span>{pending} élément(s) de l'ancienne version locale trouvé(s) dans ce navigateur. Les copier vers votre compte ?</span>
              <button className={btn} onClick={run}>Importer</button>
            </div>
          )}
          {msg && <p role="status">{msg}</p>}
        </div>
      )}
    </>
  );
}

function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Même langage visuel que les liens du menu : pas de cercle ni de bordure, juste une icône discrète */}
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Mon compte" title={email ? `Connecté : ${email}` : "Mon compte"}
        className={`relative grid h-8 w-8 place-items-center rounded-md transition-colors ${open ? "bg-accent/10 text-accent dark:bg-night-accent/15 dark:text-night-accent" : "text-muted hover:bg-accent/10 hover:text-accent dark:text-night-muted dark:hover:bg-night-accent/15 dark:hover:text-night-accent"}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-paper dark:ring-night" />
      </button>
      {open && (
        <div role="menu" className={`${card} absolute right-0 mt-2 w-64 p-3 shadow-lg`}>
          <p className="text-xs text-muted dark:text-night-muted">Connecté en tant que</p>
          <p className="mb-3 break-all text-sm font-medium">{email || "—"}</p>
          <button role="menuitem" onClick={() => supabase!.auth.signOut()}
            className="w-full rounded-md px-3 py-1.5 text-left text-sm text-muted hover:bg-accent/10 hover:text-accent dark:text-night-muted dark:hover:bg-night-accent/15 dark:hover:text-night-accent">Se déconnecter</button>
        </div>
      )}
    </div>
  );
}
