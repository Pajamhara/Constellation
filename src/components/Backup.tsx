import { useRef, useState } from "react";
import { exportBackup, importBackup } from "../data/backup";

export default function Backup() {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const cls = "text-left text-sm text-muted hover:text-ink dark:text-night-muted dark:hover:text-slate-100";

  const onFile = async (f?: File) => {
    if (!f) return;
    try { setMsg(`${await importBackup(f)} élément(s) restauré(s). Rechargez la page.`); }
    catch { setMsg("Fichier de sauvegarde invalide."); }
  };

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <button className={cls} onClick={() => exportBackup().catch(() => setMsg("Export impossible."))}>⬇️ Sauvegarder</button>
      <button className={cls} onClick={() => file.current?.click()}>⬆️ Restaurer</button>
      <input ref={file} type="file" accept="application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {msg && <p role="status" className="text-xs text-muted dark:text-night-muted">{msg}</p>}
    </div>
  );
}
