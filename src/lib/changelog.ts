export interface EntreeJournal {
  date: string; // AAAA-MM-JJ
  titre: string;
  intro: string;
  etapes: string[];
}

/**
 * Le journal des changements du site, lu par l'admin (page Journal). Il vit en code, pas
 * dans Firestore, pour qu'il parte avec chaque déploiement et que rien dans l'admin ne
 * puisse l'effacer. Règle de tenue : chaque journée de travail sur le site ajoute son
 * entrée EN TÊTE de la liste, le jour même, avant de considérer la livraison terminée.
 * Le texte s'adresse à Élise, en vouvoiement, dans ses propres mots : ce qui a changé
 * pour elle, jamais un rapport technique. Une entrée déjà écrite ne se réécrit pas.
 */
export const JOURNAL: EntreeJournal[] = [
  {
    date: "2026-09-15",
    titre: "Une brise pour vrai sur la route, ton portrait à l'accueil, et le site au complet en anglais",
    intro:
      "La vidéo de l'accueil a été refaite : la caméra ne bouge plus d'un poil, seules les herbes frémissent, et la boucle se referme sans couture. Ton portrait ouvre maintenant l'accueil, la vidéo de l'éducation sexuelle se fige sur toi, et la bascule EN traduit tout, calendrier compris.",
    etapes: [
      "La barre du haut ne garde que deux portes, Me connecter et Prendre rendez-vous, avec la langue, le thème et le menu. Le menu s'ouvre pour vrai sur toute la page, sur téléphone comme sur ordinateur.",
      "Un module Qui est Élise, juste sous la route : ta photo du 21 février en hauteur, ta phrase et un lien vers À propos. La même photo porte la page À propos.",
      "Les photos des pages s'ouvrent d'un balayage qui part du centre vers les bords, avec un fondu, au lieu d'un simple fondu.",
      "Massothérapie montre la photo Massage; Éducation sexuelle s'ouvre sur ta vidéo du 4 mars, qui joue trois secondes et se fige sur toi, puis ton texte apparaît une seconde plus tard.",
      "La liste de lecture de la page Mouvement prend toute la largeur de la page, avec le lecteur Spotify au complet.",
      "Toutes les photos du site sont maintenant dans ta médiathèque. Si tu retires une photo qui est posée sur une page, la page reprend sa photo d'origine d'elle-même, jamais un trou.",
      "Nouveau dans le tableau de bord : Recadrer les photos. Chaque photo du site y est montrée dans le cadre exact de sa page; tu cliques pour choisir ce qui reste au centre, tu glisses le zoom, et tu peux prendre une autre photo de ta médiathèque.",
      "Le pied de page porte un vrai bouton Administration, et la bascule EN traduit maintenant le calendrier, les formulaires, les cours, les événements et les textes que tu modifies sur la page (l'anglais se garde à part du français).",
    ],
  },
  {
    date: "2026-09-15",
    titre: "La route qui respire, une barre qui tient, et ton calendrier à ciel ouvert",
    intro:
      "L'accueil s'ouvre sur ta photo de la route, animée d'un souffle dans les herbes, avec le titre au centre. La barre du haut ne déborde plus, les pages intérieures ont pris de l'air, et la page Prendre rendez-vous montre ton calendrier comme le ferait Calendly.",
    etapes: [
      "Le hero est la photo de la route, recadrée au format cinéma et animée : la caméra ne bouge pas, seules les herbes frémissent. Le titre, ta phrase et les deux portes sont centrés dessus.",
      "La barre du haut porte quatre portes (Pair-aidance, Massothérapie, Éducation sexuelle, Boutique) et range tout le reste dans le menu, si bien que rien ne sort plus du cadre, même sur un petit écran.",
      "Les pages intérieures perdent la grande image collante de gauche : un titre en grand, ta phrase d'intro à côté, un bandeau photo court quand la section en a une, et beaucoup d'espace autour.",
      "Prendre rendez-vous montre le mois, les jours où tu reçois et les heures ouvertes du jour choisi; une heure choisie arrive déjà sélectionnée dans l'espace de la personne.",
      "Une nouvelle page, Consultante en consentement, avec son formulaire pour qu'un tournage, une équipe ou un lieu de vie te réserve.",
      "Poppins remplace la police à empattements pour les titres et le corps; Montserrat reste pour les étiquettes.",
      "La porte Google fonctionne de nouveau : elle passe par l'adresse que Google connaît, et une fenêtre refermée trop vite n'annule plus la connexion.",
    ],
  },
  {
    date: "2026-09-15",
    titre: "Neuf portes sur l'accueil, ton horaire à ciel ouvert, et la connexion Google réparée",
    intro:
      "L'accueil présente maintenant tes neuf domaines en tuiles de texte, deux nouvelles pages s'ajoutent, ton horaire s'affiche sur la page Pair-aidance, et la porte Google fonctionne de nouveau.",
    etapes: [
      "Le sommaire montre Pair-aidance, Massothérapie, Éducation sexuelle, Formations à venir, Cours à la carte, Boutique, Blog, Ressources et Mouvement, chacun dans sa case, sans photo ni coin arrondi.",
      "Massothérapie et Éducation sexuelle ont leur page : elles affichent les offres que tu ranges dans Consultations, sous la catégorie du même nom, et le texte de présentation se modifie directement sur la page.",
      "Cours à la carte porte le répertoire de ce que tu peux animer. Tu remplis la liste depuis Ateliers, dans ton tableau de bord, et une école ou un festival t'écrit d'un clic.",
      "Sur Pair-aidance, tes prochaines heures ouvertes s'affichent comme un calendrier, et le bouton « Investir sur mon bien-être » mène à la création du compte. La personne est accueillie par « Merci de prendre soin de toi ».",
      "La connexion Google repassait par un domaine étranger, ce qui refermait la fenêtre sans connecter personne. Elle passe maintenant par ton propre domaine.",
      "Les aperçus de ta médiathèque restaient noirs parce que le site refusait les fichiers venant de ton espace de stockage. Ils s'affichent, et un clic les ouvre en grand.",
      "Plus aucune photo n'a les coins arrondis, ni sur le site ni dans ton tableau de bord.",
    ],
  },
  {
    date: "2026-09-14",
    titre: "Nouvelle page d'accueil, sommaire en tuiles, et votre médiathèque",
    intro:
      "L'accueil s'ouvre sur votre photo du champ en pleine page, avec le titre posé à côté sur un voile de papier, le sommaire présente vos sections en tuiles de texte, et un nouvel espace vous attend dans votre tableau de bord pour y déposer vos photos.",
    etapes: [
      "La photo du champ tient maintenant tout l'écran, servie depuis votre fichier d'origine de 36 Mo, et le voile de papier qui porte le titre s'éteint en douceur sur elle sans jamais la couper net.",
      "La photo de vous assise sous l'arbre a quitté la page d'accueil : elle n'existe qu'en 547 pixels de large, ce qui est trop petit pour une pleine page, et toute version agrandie donnait ce rendu pâteux que vous avez vu.",
      "Le sommaire n'est plus une liste de lignes : chaque section devient une tuile avec son numéro, son nom en grand et sa phrase, sans photo, dans une grille dont les rangées se remplissent toujours.",
      "Votre tableau de bord porte une nouvelle entrée, Médiathèque, où vous déposez vos photos en une fois, les retrouvez toutes ensemble, copiez l'adresse de celle que vous voulez poser sur une page, et retirez celles qui ne servent plus.",
    ],
  },
  {
    date: "2026-09-14",
    titre: "Le collant Vexel dit maintenant d'où vient le studio",
    intro:
      "La carte qui s'ouvre depuis « Site créé par Vexel Webstudio », en bas de votre site, porte désormais le sigle du Salon des Inconnus et précise que le studio en est un projet.",
    etapes: [
      "Sous le nom de Vexel Webstudio, une ligne indique que le studio est un projet du Salon des Inconnus.",
      "Le sigle doré du Salon des Inconnus apparaît en bas à droite de la carte, cliquable vers son site.",
      "Une pastille avec un crayon vous attend maintenant en bas à droite de chaque page publique dès que vous êtes connectée, si bien que le mode de modification s'ouvre d'un seul clic au lieu de passer par votre tableau de bord ou par une adresse à retenir.",
    ],
  },
  {
    date: "2026-09-11",
    titre: "L'espace client à parité avec Xena Horizon, et un mode éditorial en réserve",
    intro:
      "Votre espace client a reçu ce que le site de Laurie Belhumeur avait de plus : un onglet « Mon dossier » où déposer vos motifs et vos documents, un onglet « Ressources » et un profil plus complet. Le site a aussi gagné une seconde apparence, plus éditoriale, que vous pourrez activer vous-même quand vous serez prête à la voir.",
    etapes: [
      "L'espace client s'ouvre maintenant sur une bannière et une photo de profil, comme un vrai profil, avec les onglets Mon dossier, Rendez-vous, Mes cours, Messages, Ressources, Réunion et Mon profil.",
      "Le nouvel onglet Mon dossier vous laisse déposer vos documents, voir où vous en êtes dans le parcours d'accompagnement, et écrire ce qui vous amène.",
      "Depuis votre tableau de bord, chaque document déposé se valide ou se retourne avec une note, et une place pour vos propres notes privées a été ajoutée sur chaque fiche.",
      "Un bouton « Mot de passe oublié » a été ajouté à la porte de connexion, et un bouton « Problème technique » permet à vos clientes de vous signaler un pépin directement.",
      "Un mode éditorial, plus posé et plus proche d'un magazine, a été construit en parallèle du site actuel : vous pourrez comparer les deux et choisir depuis Paramètres quand vous serez prête.",
      "Les règles de sécurité de Firestore et du stockage des fichiers ont été resserrées et testées, et ce journal des changements a été mis en place pour que vous suiviez ce qui bouge sur votre site.",
    ],
  },
  {
    date: "2026-09-03",
    titre: "Les cours de groupe peuvent se donner en direct",
    intro:
      "Vos cours de mouvement peuvent maintenant se donner en direct, par audio ou par vidéo, avec un horaire et une salle partagée pour tout le groupe.",
    etapes: [
      "Un format audio ou vidéo s'ajoute à vos cours de danse, avec un horaire précis.",
      "Une salle de rencontre partagée s'ouvre pour tout le groupe au moment du cours.",
    ],
  },
  {
    date: "2026-07-19",
    titre: "Votre domaine territoireincarne.com est branché, et le site ne montre plus rien de test",
    intro:
      "Le vrai domaine du site est maintenant branché, et tout ce qui restait de contenu d'essai (services fictifs, rendez-vous de démonstration, clientes inventées) a été retiré pour de bon.",
    etapes: [
      "Le domaine territoireincarne.com a été relié à votre site, avec les adresses de secours mises à jour partout où elles apparaissaient (le plan du site, les liens de partage, les fiches de rendez-vous).",
      "Les deux soins de démonstration et les rendez-vous factices ont été retirés de votre base de données.",
      "Les faux clients et les faux revenus qui apparaissaient au premier survol du tableau de bord ont été enlevés, avec les anciens catalogues de textes qui ne servaient plus.",
      "La section Éducation, qui n'était pas encore reliée à votre contenu réel, a été retirée en attendant d'être rebâtie avec de vrais textes.",
    ],
  },
  {
    date: "2026-07-18",
    titre: "Le décompte de séances, et un tour de sécurité complet",
    intro:
      "Vos forfaits de séances se décomptent maintenant tout seuls, et une revue de sécurité a resserré plusieurs points sensibles du site, dont certains touchaient les données de vos clientes.",
    etapes: [
      "Chaque cliente voit désormais son solde de séances, et une séance marquée complétée le décompte automatiquement de son forfait.",
      "Une cliente ne peut plus modifier elle-même son propre solde de séances ni certains champs sensibles de son compte.",
      "La demande de transcription d'une rencontre exige maintenant d'être connectée et d'y avoir droit.",
      "Le site s'affiche maintenant plus vite, la police de votre marque s'applique bien dans les espaces client et admin, et le thème (clair ou sombre) suit d'abord la préférence de l'appareil.",
    ],
  },
  {
    date: "2026-07-04",
    titre: "Des images beaucoup plus légères, et un site plus accessible",
    intro:
      "Vos images se chargeaient très lentement à cause de fichiers bruts beaucoup trop lourds; elles sont maintenant redimensionnées automatiquement, et plusieurs détails d'accessibilité ont été corrigés.",
    etapes: [
      "Les photos de votre site, dont certaines dépassaient 35 mégaoctets, se chargent maintenant en quelques centaines de kilo-octets, sans perte visible.",
      "Un lien d'évitement, un contour de focus visible et le respect du mouvement réduit ont été ajoutés pour les personnes qui naviguent au clavier ou qui sont sensibles aux animations.",
      "Le site s'est doté de données structurées pour les moteurs de recherche et d'une image de partage sur les réseaux sociaux.",
    ],
  },
  {
    date: "2026-05-18",
    titre: "La naissance du site",
    intro:
      "Territoire Incarné est né : la structure complète du site a été posée, avec ses sections Thérapie, Mouvement, Événements, Ressources, Connecter, Boutique et Écrits.",
    etapes: [
      "Le site a été bâti avec un portail client, un tableau de bord admin et la connexion à Firebase.",
    ],
  },
];

/** Nombre total de « choses livrées » toutes entrées confondues, pour la vignette de résumé. */
export const nombreEtapes = (): number => JOURNAL.reduce((n, e) => n + e.etapes.length, 0);
