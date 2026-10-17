export type ID = string;
 
interface Base {
  id: ID;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  ownerId: string;   // "local" aujourd'hui ; utilisateur authentifié plus tard
}
 
/** Répétition hebdomadaire. weekdays : 0 = lundi … 6 = dimanche. */
export interface Recurrence {
  weekdays: number[]; intervalWeeks: 1 | 2; until?: string;
  skip?: string[];                      // dates supprimées individuellement
  overrides?: Record<string, Override>; // dates modifiées individuellement (clé = date d'origine)
}
export type Override = Partial<Pick<CalendarEvent, "title" | "date" | "startTime" | "endTime" | "description" | "color">>;
 
export interface CalendarEvent extends Base {
  recurrence?: Recurrence;
  endDate?: string; // dernier jour d'un événement sur plusieurs jours (AAAA-MM-JJ)
  title: string; date: string; // AAAA-MM-JJ
  startTime?: string; endTime?: string; description?: string; color?: string;
}
 
export type ProjectStatus = "idea" | "todo" | "active" | "paused" | "done";
 
export interface Project extends Base {
  name: string; description: string; status: ProjectStatus;
  progressMode: "auto" | "manual"; manualProgress: number;
  goal?: string; notes: string; completedAt?: string; // renseignée quand le statut passe à « Terminé »
}
 
export interface Task extends Base {
  projectId: ID; title: string; done: boolean; position: number;
}
 
export type Priority = "low" | "medium" | "high";
 
export interface Idea extends Base {
  title: string; description: string; notes: string;
  priority?: Priority; tags: string[]; convertedProjectId?: ID;
}
