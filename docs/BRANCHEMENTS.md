# Branchements de Territoire Incarné

Ce que le site sait faire, et ce qui attend une clé ou un geste de console avant de tourner en
production. Chaque bloc dit ce que ça fait, où vit le code, et le geste exact qui reste à poser.
Mis à jour le 11 septembre 2026.

## Connexion Google (clientes et admin)

Ce que ça fait : n'importe qui ouvre son espace personnel avec son compte Google, et Élise entre
dans le tableau de bord avec le sien (`territoireincarne@gmail.com`), reconnu par courriel vérifié.
Le fournisseur Google est activé dans Firebase Auth, les domaines `territoireincarne.com` et
`www.territoireincarne.com` sont autorisés, et la CSP laisse passer `apis.google.com` et l'iframe
d'authentification de `territoireincarne-80bb9.firebaseapp.com` (c'est cette CSP, posée le 11
septembre au matin, qui bloquait la fenêtre Google jusqu'au soir).

La liste des administratrices vit dans `src/lib/admins.ts`, `functions/src/admins.ts`,
`firestore.rules` et `storage.rules`, à tenir alignées : `territoireincarne@gmail.com`,
`fruiterre@gmail.com`, `houseoftherisingarts@gmail.com`, `alex@lesalondesinconnus.com`.

Rien à brancher. Si un jour l'authDomain passe au domaine du site (fenêtre Google qui reste au
premier niveau dans Safari), il faudra d'abord ajouter
`https://territoireincarne.com/__/auth/handler` aux URI de redirection du client OAuth
« Web client (auto created by Google Service) » dans la console Google Cloud, sinon
`redirect_uri_mismatch`.

## Stripe (cours de danse, événements, boutique)

Ce que ça fait : une personne s'inscrit à un cours de danse payant ou à un événement, passe par la
caisse Stripe, et le webhook marque sa place payée. Le prix se lit dans Firestore côté serveur,
jamais dans la requête, et la capacité se vérifie avant d'ouvrir la caisse. Le code vit dans
`functions/src/createCheckoutSession.ts` et `functions/src/stripeWebhook.ts`; côté site,
`src/sections/Mouvement.tsx` (inscription directe) et `src/sections/Events.tsx`.

Ce qui attend : **le compte Stripe d'Élise**. L'argent des cours est le sien, il ne passe pas par le
compte du Salon. Une fois son compte ouvert (stripe.com, compte standard au nom de Territoire
Incarné) :

```bash
cd "~/Documents/Websites/territoire-incarné (1)"
firebase functions:secrets:set STRIPE_SECRET_KEY        # sk_live_…
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET    # whsec_… (voir ci-dessous)
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook
```

Le webhook se déclare dans le tableau de bord Stripe (Développeurs › Webhooks) à l'adresse
`https://us-central1-territoireincarne-80bb9.cloudfunctions.net/stripeWebhook` avec les événements
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` et
`invoice.payment_failed`; le `whsec_` qu'il rend est le deuxième secret. Tant que les deux secrets
portent la valeur de garde, le bouton « Payer ma place » répond « Le paiement n'est pas encore
ouvert ». Les cours gratuits, eux, marchent dès maintenant.

## Google Agenda (rendez-vous)

Deux chemins, le premier marche tout de suite.

**1. Le flux iCal d'abonnement (en ligne).** Admin › Calendrier › Google Agenda › « Obtenir mon lien
d'abonnement ». Élise colle ce lien dans Google Agenda (Autres agendas › À partir de l'URL) ou dans
Apple Calendrier : ses rendez-vous confirmés et ses demandes en attente y apparaissent et s'y
mettent à jour (Google rafraîchit un agenda abonné toutes les quelques heures). Code :
`functions/src/calendrierIcs.ts`.

**2. La synchronisation OAuth (attend la console).** Ses rendez-vous confirmés deviennent des
événements dans SON agenda, et ses plages déjà prises chez Google bloquent les créneaux du site.
Code : `functions/src/agenda/google.ts`, panneau `GoogleAgendaPanel.tsx`. Gestes de console :

1. Sur [console.cloud.google.com](https://console.cloud.google.com), projet `territoireincarne-80bb9`,
   activer l'API **Google Calendar API**.
2. « APIs et services › Écran de consentement OAuth » : type Externe, nom « Territoire Incarné »,
   portées `.../auth/calendar.events` et `.../auth/calendar.readonly`, et le courriel d'Élise en
   utilisatrice de test tant que l'app n'est pas publiée.
3. « Identifiants › Créer un ID client OAuth » de type Application Web, avec l'URI de redirection
   `https://us-central1-territoireincarne-80bb9.cloudfunctions.net/agendaGoogleRetour`.
4. Poser les secrets et redéployer :

```bash
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
firebase deploy --only functions
```

Puis Élise clique « Connecter mon Google Agenda » dans Admin › Calendrier › Google Agenda. La
synchronisation tourne toutes les 15 minutes et sur-le-champ à chaque changement de rendez-vous.

## Rencontre vidéo (Daily.co)

La clé `VITE_DAILY_API_KEY` est encore lue côté navigateur (`src/services/daily.ts`), donc visible
dans le bundle : elle doit tourner et passer derrière une fonction, comme chez Xena avec Jitsi. C'est
la dette de sécurité numéro un du dépôt, notée depuis juillet.

## Bouton « Problème technique »

Le bouton de l'espace client écrit dans `bugs/` et tente d'envoyer à Vexel par `VEXEL_PORTE`
(`src/components/client/ProblemeTechnique.tsx`). La fiche `clients/territoire-incarne` a été créée
le 12 septembre 2026 dans `vexel-integrations` avec la clé `Jq0wB2iOGqBWljdRZqWG9dFm`, posée dans
`VEXEL_CLE` : rien à brancher.

## Programme partenaire Vexel

Le panneau « Devenir partenaire Vexel » (onglet Partenaire Vexel de l'admin,
`src/components/admin/PartenaireVexelSection.tsx`) et le collant du pied de page
(`src/vexel/BadgeVexel.tsx`, dans le pied de page à côté du collant « Site créé par ») utilisent la
même clé `Jq0wB2iOGqBWljdRZqWG9dFm` et le même slug `territoire-incarne`. Une fois le code reçu, le
site écrit lui-même `settings/vexel.partenaire` dans sa propre base (règle déjà couverte par
`match /settings/{settingId}` dans `firestore.rules`, lecture publique, écriture admin). Rien à
brancher.
