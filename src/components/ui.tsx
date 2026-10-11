import { useEffect, useState, type ReactNode } from "react";
import type { SaveState } from "../hooks/useCollection";

export const card = "rounded-lg border border-line bg-surface dark:border-night-line dark:bg-night-surface";
export const input =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted dark:border-night-line dark:bg-night dark:placeholder:text-night-muted";
export const btn =
  "rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-night-accent dark:text-night";

export function PageHeader({ title, save, children }: { title: string; save?: SaveState; children?: ReactNode }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {save && <SaveStatus state={save} />}
        {children}
      </div>
    </header>
  );
}

export function SaveStatus({ state }: { state: SaveState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "saved") return <span role="status" className="text-xs text-muted dark:text-night-muted">✓ Enregistré</span>;
  return (
    <span role="alert" className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
      Non enregistré : {state.message}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={`${card} border-dashed px-6 py-12 text-center`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted dark:text-night-muted">{hint}</p>
    </div>
  );
}

export const label = "mb-1 block text-xs text-muted dark:text-night-muted";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`${card} max-h-full w-full max-w-md overflow-y-auto p-5`} onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-line dark:bg-night-line">
      <div className="h-full rounded-full bg-accent dark:bg-night-accent" style={{ width: `${value}%` }} />
    </div>
  );
}

/** Champ à sauvegarde automatique : enregistre à la sortie du champ, seulement si la valeur a changé. */
export function AutoText({ value, onCommit, multiline, required, className = "", placeholder, ariaLabel }: {
  value: string; onCommit: (v: string) => void; multiline?: boolean; required?: boolean;
  className?: string; placeholder?: string; ariaLabel: string;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => {
    if (required && !v.trim()) return setV(value);
    if (v !== value) onCommit(v);
  };
  const props = { value: v, onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setV(e.target.value), onBlur: commit, placeholder, "aria-label": ariaLabel, className: `${input} ${className}` };
  return multiline ? <textarea rows={4} {...props} /> : <input {...props} />;
}
