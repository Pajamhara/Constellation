# Tableau de bord

React + TypeScript + Vite + Tailwind. Données dans Supabase (Postgres), inscription/connexion par e-mail,
chaque utilisateur ne voit que ses propres données (RLS).

## Configurer
1. Supabase : exécuter `supabase/schema.sql` (SQL Editor), régler Authentication (voir ci-dessous).
2. Ouvrir `index.html` (ou `tableau-de-bord.html` déjà construit) dans un éditeur de texte et remplir :
       window.APP_CONFIG = { supabaseUrl: "https://xxxx.supabase.co", supabaseAnonKey: "..." };
   Clé publique uniquement (anon / publishable). JAMAIS la clé service_role / secret.

## Authentication (Supabase)
- Providers > Email : activé. Longueur minimale du mot de passe : 8 ou plus.
- URL Configuration : Site URL = l'adresse publique du site ; ajouter la même dans Redirect URLs.
- « Confirm email » : activé (recommandé pour un site public) ou désactivé (accès immédiat).

## Héberger (GitHub Pages)
Pousser sur `main`, Settings > Pages > Source : GitHub Actions. Le workflow construit et publie.
Un fichier HTML ouvert sur un seul PC ne peut pas être partagé : pour de vrais utilisateurs, il faut le site en ligne.

## Développer
    npm install && npm run dev      # Node 20+
    npm run build                   # produit dist/index.html (fichier autonome)

## Application de bureau (Windows / macOS / Linux) avec Tauri
Le même site est embarqué tel quel dans une fenêtre native ; les données restent dans Supabase.
- **Sans rien installer** : `git tag v0.1.0 && git push origin v0.1.0`. GitHub construit les installateurs
  (Settings > Actions autorisées) et les dépose dans Releases (brouillon à publier).
- **Sur votre PC** : installer Rust (rustup.rs) et, sous Windows, les « Build Tools C++ » de Visual Studio, puis
  `npm install` et `npm run tauri dev` (essai) ou `npm run tauri build` (installateur dans `src-tauri/target/release/bundle`).
- Renseigner `siteUrl` dans `window.APP_CONFIG` (adresse publique du site) : les liens des e-mails de confirmation y mènent.
- Dans l'appli de bureau, « Mot de passe oublié » se fait depuis la version web.
- Installateurs non signés : Windows affiche « SmartScreen » (Informations complémentaires > Exécuter quand même) ;
  sur macOS, clic droit > Ouvrir la première fois.

## Mot de passe oublié
Par défaut, l'utilisateur reçoit le lien « Reset Password » du modèle Supabase standard : le clic ouvre le site sur l'écran
« Nouveau mot de passe », depuis n'importe quel navigateur. Réglages Supabase (Authentication > URL Configuration) :
**Site URL** = adresse publique du site ; **Redirect URLs** = la même adresse avec `**` à la fin.
Option « code à 6 chiffres » : après avoir branché un SMTP personnalisé et ajouté `{{ .Token }}` au modèle, mettre
`resetByCode: true` dans `window.APP_CONFIG`.
