# Branchements

Ce que chaque intégration externe du site demande d'Alex : un compte, une clé, un geste précis, et où
déposer le résultat. Une section par intégration, avec son état au 11 septembre 2026. Le projet
Firebase est `territoireincarne-80bb9` (Hosting, Firestore, Auth, Storage; Cloud Functions déclarées
dans `functions/` mais jamais déployées à ce jour).

## Le bouton « Problème technique » (porte Vexel `recevoirDemande`)

Ce que ça fait : depuis l'espace client (`src/components/client/ProblemeTechnique.tsx`), une cliente
décrit un pépin, capture ou téléverse une image, puis l'envoi range le rapport dans `bugs/{id}` sur ce
projet ET le transmet à la porte commune de Vexel (`recevoirDemande`), où l'onglet Demandes de l'admin
Vexel le montre sous la fiche de Territoire Incarné, comme chez Krystine.

État : **codé jusqu'au branchement, la clé manque**. `VEXEL_CLE` dans `ProblemeTechnique.tsx` vaut
`"A_BRANCHER"` : tant que ce n'est pas une vraie clé, la porte Vexel refuse l'appel silencieusement (le
rapport reste quand même écrit dans `bugs/{id}` sur ce projet, rien n'est perdu, seul le double envoi au
studio manque).

Geste exact d'Alex : depuis l'admin de `vexelwebstudio.com`, ajouter Territoire Incarné à la liste des
clients qui posent des demandes (le même geste que pour Krystine), obtenir la clé émise pour
`client: "territoire-incarne"`, puis coller cette clé dans `VEXEL_CLE`
(`src/components/client/ProblemeTechnique.tsx`), rebuild et redéployer le hosting.

## Le collant « Site créé par Vexel Webstudio »

Ce que ça fait : `src/components/common/BadgeVexel.tsx`, en bas à droite du site public, mène à
`vexelwebstudio.com`. Territoire Incarné n'est pas dans un programme partenaire Vexel : aucun rabais ni
commission n'est promis dans ce collant, contrairement au badge de Xena Horizon.

État : **branché**, aucun geste requis.

## Le mode éditorial

Ce que ça fait : la bascule Actuel/Éditorial dans Paramètres écrit `settings/apparence.mode` dans
Firestore, lu par `useMode()` au chargement. Aucune clé, aucun compte : c'est un document Firestore,
déjà protégé par les règles (lecture publique, écriture admin seulement).

État : **branché**, aucun geste requis. Le mode par défaut est `actuel` : le public ne voit rien changer
tant qu'Élise n'a pas basculé le réglage.

## Le dossier client (« Mon dossier »)

Ce que ça fait : pièces déposées, parcours en étapes, notes privées, exports Markdown et CSV — tout
vit dans `users/{uid}` et sa sous-collection `notes`, plus `settings/dossier` pour le catalogue
éditable. Aucune clé externe.

État : **branché**, aucun geste requis. Le catalogue par défaut (`src/lib/dossier.ts`,
`PIECES_PAR_DEFAUT` et `ETAPES_PAR_DEFAUT`) est un point de départ raisonnable, pas un catalogue
confirmé par Élise : à revoir avec elle avant que de vraies clientes déposent des documents, exactement
la même réserve que Xena a posée pour Laurie. Modifiable depuis Paramètres sans redéploiement.

## Ce qui reste des dettes de sécurité connues (non aggravées, non toutes réglées cette passe)

Ces points existaient avant cette passe (`~/.claude/projects/-Users-lesalondesinconnus/memory/project_territoire_incarne.md`,
`~/Documents/Onyx/10_projects/territoire-incarne/plan-action-fable5-2026-07-04.md`) et restent à régler
par un chantier serveur séparé :

- **Clé API Daily.co dans le bundle public** (`src/services/daily.ts`) : la création de salles et de
  jetons vidéo tourne côté client. À roter et déplacer côté serveur (une Cloud Function admin).
- **UID admin legacy** (`BYR9pdEGCfYpU5kmbMoyRr9paRq1`) encore dans `lib/admins.ts` et
  `firestore.rules` : à retirer une fois confirmé qu'il ne sert plus à personne.
- **Prix de checkout fixés côté client** (`functions/src/createCheckoutSession.ts`) : à corriger en
  rechargeant le prix depuis Firestore côté serveur.
- **`storage.rules` : réglé cette passe** (le fichier n'existait pas du tout avant le 11 septembre 2026,
  voir plus haut « Ce qui a été ajouté cette passe »).

## Ce qui a été ajouté cette passe (11 septembre 2026), sans dépendance externe

- `storage.rules` (n'existait pas) : règles par dossier (`dossiers/{uid}`, `profils/{uid}`, `bugs/{uid}`,
  médiathèque publique), bornes de taille et de type, testées sur l'émulateur (`tests/rules.test.mjs`,
  `npm run test:rules`).
- `firestore.rules` : ajout de `dossierClientOK()` (bornes sur `bio`, `liensUrl`, `projet`), verrou sur
  `etape` et `revue` (admin seulement), collections `bugs` et `settings`, sous-collection
  `users/{uid}/notes` (admin-only).
- En-têtes de sécurité dans `firebase.json` : `X-Frame-Options: DENY` et une Content-Security-Policy
  complète (`script-src 'self'`, connexions limitées aux domaines Firebase/Google et à
  `*.cloudfunctions.net`, `frame-src` limité à Daily.co et Google, `frame-ancestors 'none'`). Vérifié
  sans erreur de console en production après déploiement (voir le rapport de session).
- `public/llms.txt`, page 404 réelle (`src/components/common/NotFound.tsx`), catalogue de pièces/étapes
  éditable, journal des changements (`src/lib/changelog.ts`).
