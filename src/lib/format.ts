const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
export const formatDate = (iso: string) => fmt.format(new Date(iso));
export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

const pad = (n: number) => String(n).padStart(2, "0");
/** Date locale -> "AAAA-MM-JJ" (sans décalage de fuseau). */
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long" });
export const formatDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return dayFmt.format(new Date(y, m - 1, d)); };
export const formatDateTime = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
