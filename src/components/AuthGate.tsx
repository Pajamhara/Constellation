import { useEffect, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { arrivedFromEmailLink, emailLinkFailed, emailLinkType, supabase } from "../data/supabaseClient";
import { redirectBase, RESET_BY_CODE } from "../config";
import { btn, card, input } from "./ui";

// Mémorise (1 h) qu'une réinitialisation a été demandée depuis CE navigateur, pour reconnaître le retour du lien.
const RECOVERY_KEY = "recovery-requested-at";
const recoveryPending = () => { try { return Date.now() - Number(localStorage.getItem(RECOVERY_KEY) ?? 0) < 3600_000; } catch { return false; } };
const setRecovery = (on: boolean) => { try { if (on) localStorage.setItem(RECOVERY_KEY, String(Date.now())); else localStorage.removeItem(RECOVERY_KEY); } catch { /* non critique */ } };

export default function AuthGate({ children }: { children: ReactNode }) {
  if (!supabase) return <Shell><SetupNotice /></Shell>;
  return <Gate client={supabase}>{children}</Gate>;
}

const Shell = ({ children }: { children: ReactNode }) => <div className="grid min-h-screen place-items-center px-4">{children}</div>;

function SetupNotice() {
  return (
    <div className={`${card} w-full max-w-md space-y-2 p-6 text-sm`}>
      <h1 className="text-lg font-semibold">Configuration requise</h1>
      <p>Renseignez l'URL du projet Supabase et la clé publique dans <code>index.html</code> (bloc <code>window.APP_CONFIG</code>), puis rechargez la page.</p>
      <p className="text-muted dark:text-night-muted">Voir le README, étape « Configurer ».</p>
    </div>
  );
}

function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("not confirmed")) return "Confirmez d'abord votre e-mail (lien reçu par courrier).";
  if (m.includes("token") || m.includes("otp") || m.includes("expired")) return "Code invalide ou expiré. Vérifiez-le ou demandez un nouveau code.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (m.includes("different from the old")) return "Choisissez un mot de passe différent de l'ancien.";
  if (m.includes("password")) return "Mot de passe refusé : utilisez au moins 8 caractères.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Connexion impossible : vérifiez votre réseau et l'URL Supabase.";
  return `Erreur : ${message}`;
}

type Mode = "in" | "up" | "reset";
const recentRecovery = (s: Session) => { const t = Date.parse(s.user.recovery_sent_at ?? ""); return !Number.isNaN(t) && Date.now() - t < 3600_000; };

function Gate({ client, children }: { client: SupabaseClient; children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(emailLinkFailed ? "Ce lien a expiré ou a déjà été utilisé. Essayez de vous connecter, ou refaites une demande." : "");
  // Si on voit l'écran de connexion après un clic sur un lien, il a été ouvert dans un autre navigateur/appareil.
  const [info, setInfo] = useState(
    arrivedFromEmailLink && !emailLinkFailed
      ? recoveryPending()
        ? "Pour changer votre mot de passe, ouvrez le lien depuis le navigateur où vous avez fait la demande, ou refaites une demande ici."
        : "Si vous venez de cliquer sur le lien de confirmation, votre compte est prêt : connectez-vous avec votre e-mail et votre mot de passe."
      : ""
  );
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false); // réinitialisation : e-mail envoyé, en attente du code
  const [code, setCode] = useState("");

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session && (emailLinkType === "recovery" || (arrivedFromEmailLink && (recoveryPending() || recentRecovery(data.session))))) setRecovering(true);
    });
    const { data } = client.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  if (session === undefined) return null;
  if (session && recovering) return <Shell><NewPassword client={client} onDone={() => setRecovering(false)} /></Shell>;
  if (session) return <>{children}</>;

  const switchMode = (m: Mode) => { setMode(m); setError(""); setInfo(""); setSent(false); setCode(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setInfo("");
    if (mode === "reset") {
      if (sent) {
        // Étape 2 : le code à 6 chiffres de l'e-mail ouvre une session de récupération → écran « Nouveau mot de passe ».
        setRecovering(true);
        const { error } = await client.auth.verifyOtp({ email, token: code.trim(), type: "recovery" });
        if (error) { setRecovering(false); setError(frenchError(error.message)); }
      } else {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectBase() });
        if (error) setError(frenchError(error.message));
        else { setRecovery(true);
          if (RESET_BY_CODE) setSent(true);
          setInfo(RESET_BY_CODE
            ? "Si un compte existe avec cette adresse, un e-mail vient d'être envoyé. Saisissez le code qu'il contient (ou cliquez sur son lien)."
            : "Si un compte existe avec cette adresse, un e-mail vient d'être envoyé. Cliquez sur le lien « Reset Password » qu'il contient : vous pourrez alors choisir un nouveau mot de passe."); }
      }
    } else if (mode === "up") {
      if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); setBusy(false); return; }
      const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: redirectBase() } });
      if (error) setError(frenchError(error.message));
      else if (!data.session) setInfo("Compte créé. Si la confirmation par e-mail est activée, cliquez sur le lien reçu par courrier, puis connectez-vous.");
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) setError(frenchError(error.message));
    }
    setBusy(false);
  };

  const tab = (m: Mode, text: string) => (
    <button type="button" onClick={() => switchMode(m)}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm ${mode === m ? "bg-accent/10 font-medium text-accent dark:bg-night-accent/15 dark:text-night-accent" : "text-muted dark:text-night-muted"}`}>{text}</button>
  );

  return (
    <Shell>
      <form onSubmit={submit} className={`${card} w-full max-w-sm space-y-3 p-6`}>
        <h1 className="text-lg font-semibold">{mode === "reset" ? "Mot de passe oublié" : "Tableau de bord"}</h1>
        {mode === "reset"
          ? <p className="text-sm text-muted dark:text-night-muted">Saisissez votre e-mail : nous vous envoyons {RESET_BY_CODE ? "un code" : "un lien"} pour choisir un nouveau mot de passe.</p>
          : <div className="flex gap-1">{tab("in", "Connexion")}{tab("up", "Inscription")}</div>}
        <input className={input} type="email" required autoComplete="email" placeholder="E-mail" aria-label="E-mail" readOnly={mode === "reset" && sent} value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode === "reset" && sent && (
          <input className={input} inputMode="numeric" autoComplete="one-time-code" required autoFocus placeholder="Code reçu par e-mail" aria-label="Code reçu par e-mail" value={code} onChange={(e) => setCode(e.target.value)} />
        )}
        {mode !== "reset" && (
          <input className={input} type="password" required minLength={mode === "up" ? 8 : undefined} autoComplete={mode === "up" ? "new-password" : "current-password"}
            placeholder={mode === "up" ? "Mot de passe (8 caractères min.)" : "Mot de passe"} aria-label="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {info && <p role="status" className="text-sm">{info}</p>}
        <button className={`${btn} w-full`} disabled={busy}>
          {busy ? "Veuillez patienter…" : mode === "up" ? "Créer mon compte" : mode === "reset" ? (sent ? "Valider le code" : RESET_BY_CODE ? "Envoyer le code" : "Envoyer le lien") : "Se connecter"}
        </button>
        {mode === "in" && <button type="button" onClick={() => switchMode("reset")} className="w-full text-center text-sm text-muted underline dark:text-night-muted">Mot de passe oublié ?</button>}
        {mode === "reset" && sent && <button type="button" onClick={() => { setSent(false); setCode(""); setInfo(""); setError(""); }} className="w-full text-center text-sm text-muted underline dark:text-night-muted">Renvoyer un code</button>}
        {mode === "reset" && <button type="button" onClick={() => switchMode("in")} className="w-full text-center text-sm text-muted underline dark:text-night-muted">← Retour à la connexion</button>}
      </form>
    </Shell>
  );
}

function NewPassword({ client, onDone }: { client: SupabaseClient; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (pw !== pw2) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const { error } = await client.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(frenchError(error.message));
    setRecovery(false);
    history.replaceState(null, "", location.pathname + location.hash); // retire ?code=… de l'adresse
    onDone();
  };

  const cancel = () => { setRecovery(false); client.auth.signOut(); onDone(); };

  return (
    <form onSubmit={submit} className={`${card} w-full max-w-sm space-y-3 p-6`}>
      <h1 className="text-lg font-semibold">Nouveau mot de passe</h1>
      <input className={input} type="password" required minLength={8} autoFocus autoComplete="new-password" placeholder="Nouveau mot de passe (8 caractères min.)" aria-label="Nouveau mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
      <input className={input} type="password" required minLength={8} autoComplete="new-password" placeholder="Confirmer le mot de passe" aria-label="Confirmer le mot de passe" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button className={`${btn} w-full`} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le mot de passe"}</button>
      <button type="button" onClick={cancel} className="w-full text-center text-sm text-muted underline dark:text-night-muted">Annuler</button>
    </form>
  );
}
