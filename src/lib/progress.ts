import type { Project, ProjectStatus, Task } from "../types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "Idée", todo: "À commencer", active: "En cours", paused: "En pause", done: "Terminé",
};

export function tasksOf(p: Project, tasks: Task[]) { return tasks.filter((t) => t.projectId === p.id).sort((a, b) => a.position - b.position); }

export function progressOf(p: Project, tasks: Task[]): number {
  if (p.progressMode === "manual") return p.manualProgress;
  const own = tasks.filter((t) => t.projectId === p.id);
  return own.length ? Math.round((own.filter((t) => t.done).length / own.length) * 100) : 0;
}
