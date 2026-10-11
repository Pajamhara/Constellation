import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

// Lus AVANT la création du client : de quel lien d'e-mail arrive-t-on ? (jetons dans le « # », ou ?code=… dans l'adresse)
const hashParams = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
const queryParams = new URLSearchParams(location.search);
export const emailLinkType = hashParams.get("type") ?? queryParams.get("type"); // "recovery", "signup"…
export const arrivedFromEmailLink = queryParams.has("code") || hashParams.has("access_token");
export const emailLinkFailed = hashParams.has("error_description") || queryParams.has("error_description");
// Une erreur laissée dans le « # » perturberait le routeur de l'app : on la retire (le message est affiché à l'écran de connexion).
if (hashParams.has("error_description")) history.replaceState(null, "", location.pathname + location.search);

export const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Flux « implicite » : le lien de l'e-mail contient directement la session (dans le « # »). Contrairement à PKCE,
// il fonctionne même ouvert dans un autre navigateur, sur un autre appareil, ou si la demande vient d'une autre adresse
// (fichier local, appli de bureau…). Supabase retire ensuite le « # » de l'adresse.
export const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: "implicit", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
