declare global {
  interface Window { APP_CONFIG?: { supabaseUrl?: string; supabaseAnonKey?: string; siteUrl?: string; resetByCode?: boolean }; __TAURI_INTERNALS__?: unknown }
}
const c = window.APP_CONFIG ?? {};

// Valeurs lues dans index.html (window.APP_CONFIG), sinon dans .env (VITE_*).
// La clé publique (anon / publishable) n'est PAS un secret : la protection vient des règles RLS.
export const SUPABASE_URL = (c.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "").trim();
export const SUPABASE_KEY = (c.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

/** Adresse publique du site (ex. GitHub Pages) : les liens des e-mails y mènent quand on utilise l'appli de bureau. */
export const SITE_URL = (c.siteUrl || import.meta.env.VITE_SITE_URL || "").trim();
export const isDesktop = "__TAURI_INTERNALS__" in window;
export const redirectBase = () => (isDesktop && SITE_URL ? SITE_URL : location.origin + location.pathname);

/** À activer (resetByCode: true) seulement si le modèle d'e-mail « Reset Password » contient {{ .Token }} (SMTP personnalisé). */
export const RESET_BY_CODE = Boolean(c.resetByCode);
