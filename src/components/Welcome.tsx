import { useEffect, useState } from "react";
import { arrivedFromEmailLink, emailLinkType, supabase } from "../data/supabaseClient";
import { Modal, btn } from "./ui";

/**
 * Fenêtre de bienvenue, affichée une seule fois par compte (au premier accès),
 * que l'on arrive par le lien de l'e-mail ou en se connectant. Le « déjà vu » est
 * mémorisé dans le profil Supabase (user_metadata), donc valable sur tous les appareils.
 */
export default function Welcome() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (arrivedFromEmailLink) history.replaceState(null, "", location.pathname + location.hash); // retire ?code=…
    supabase?.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setEmail(user.email ?? "");
      if (!user.user_metadata?.welcomed) setOpen(true);
    });
  }, []);

  const close = () => {
    setOpen(false);
    supabase?.auth.updateUser({ data: { welcomed: true } }).catch(() => { /* réaffichée au prochain accès */ });
  };

  if (!open) return null;
  return (
    <Modal title="Bienvenue 👋" onClose={close}>
      <p className="text-sm">{arrivedFromEmailLink && emailLinkType !== "recovery" ? "Votre adresse e-mail est confirmée." : "Votre compte est prêt."}</p>
      {email && (
        <p className="mt-2 text-sm">
          Vous êtes connecté avec :
          <strong className="mt-0.5 block break-words">{email}</strong>
        </p>
      )}
      <ul className="mt-3 space-y-1 text-sm text-muted dark:text-night-muted">
        <li>📅 Ajoutez vos événements dans le calendrier</li>
        <li>🚀 Suivez vos projets étape par étape</li>
        <li>💡 Notez vos idées au fil de l'eau</li>
      </ul>
      <div className="mt-5 flex justify-end"><button className={btn} onClick={close} autoFocus>Commencer</button></div>
    </Modal>
  );
}
