import type { EtapeVisite } from './VisiteGuidee';

// ─── Les étapes de la visite guidée de Territoire Incarné ───────────
// Une étape par section du menu, dans l'ordre, plus ce qui se passe sur
// le site public et dans l'espace des clientes. Chaque phrase reprend ce
// que la section fait vraiment.

export const ETAPES_VISITE: EtapeVisite[] = [
  { titre: 'Bienvenue dans votre espace', corps: 'Cette visite fait le tour de votre site en quelques minutes, une section à la fois, et chaque carte ouvre la section dont elle parle pour que vous la voyiez avec vos vraies données. Le bouton « Visite guidée », au bas du menu, la rouvre quand vous voulez.' },
  { titre: 'Le tableau de bord', ancre: 'dashboard', corps: 'Les revenus et les dépenses du mois, les nouvelles demandes, les événements à venir, les messages non lus et le compte des abonnées à l’infolettre se lisent ici d’un coup d’œil, et chaque case mène à sa section.' },
  { titre: 'Vos clientes', ancre: 'clients', corps: 'Chaque cliente qui ouvre son espace sur le site a ici sa fiche : son dossier, les pièces qu’elle a déposées, son parcours qui s’allume à mesure, ses rendez-vous et vos échanges. Vous jugez une pièce, vous faites avancer l’étape, et vous exportez la liste en CSV quand il le faut.' },
  { titre: 'Les prospects', ancre: 'prospects', corps: 'Les personnes qui vous ont écrit sans encore réserver attendent ici, avec ce qu’elles ont demandé, pour que personne ne se perde entre un premier message et un premier rendez-vous.' },
  { titre: 'Les demandes', ancre: 'interventions', corps: 'Les demandes de service arrivées par le site se traitent ici, une par une, jusqu’à ce qu’elles deviennent un rendez-vous ou une réponse.' },
  { titre: 'Vos consultations', ancre: 'tarifs', corps: 'Vos soins et vos accompagnements s’affichent sur la page Thérapie en cartes, avec le prix et la durée que vous fixez ici. Une consultation que vous ajoutez paraît sur le site aussitôt, et une cliente peut la réserver après avoir ouvert son compte.' },
  { titre: 'Le calendrier', ancre: 'calendar', corps: 'Vous posez vos disponibilités ici, et le site ne propose aux clientes que les heures que vous avez ouvertes. Une fois branché, votre agenda Google bloque aussi les plages déjà prises ailleurs.' },
  { titre: 'Les finances', ancre: 'finances', corps: 'Vos revenus et vos dépenses se notent ici par catégorie, et le tableau de bord en tire les chiffres du mois. Les paiements par carte et par Interac s’y retrouvent quand les clés de Stripe sont posées.' },
  { titre: 'Les rendez-vous', ancre: 'bookings', corps: 'Chaque réservation prise sur le site arrive ici avec le nom de la cliente et l’heure, et son état se lit à côté. Vous confirmez ou vous annulez d’un geste, et la salle vidéo s’ouvre dans la page à l’heure dite, avec la transcription de la séance qui suit quand la clé est posée.' },
  { titre: 'Les messages', ancre: 'messages', corps: 'Le fil avec chaque cliente vit ici et dans son espace à elle : bulles, horodatage, et la mention « vu » quand elle a lu. C’est le même fil des deux côtés.' },
  { titre: 'La boutique', ancre: 'boutique', corps: 'Les produits que vous mettez ici paraissent sur la page Boutique, et le paiement par Stripe s’occupe de la caisse. Une case vide sur le site veut dire qu’il n’y a encore rien ici.' },
  { titre: 'Les événements', ancre: 'events', corps: 'Les ateliers comme les retraites se créent ici avec la date, le lieu et le nombre de places, et le site vend les inscriptions par Stripe. Le compte des inscrites suit tout seul.' },
  { titre: 'Les cours en direct', ancre: 'cours', corps: 'Vos cours de groupe en direct se programment ici : la salle s’ouvre d’elle-même à l’heure et se ferme après, et les clientes inscrites la trouvent dans leur espace sous « Mes cours ».' },
  { titre: 'Les ressources', ancre: 'ressources', corps: 'Les liens et les numéros que vous voulez partager se rangent ici, avec les lectures que vous recommandez, et ils paraissent sur la page Ressources du site comme dans l’onglet Ressources de l’espace de vos clientes.' },
  { titre: 'Les écrits', ancre: 'writings', corps: 'Votre blogue s’écrit ici par blocs de texte et d’images, et un billet ne paraît sur la page Écrits que lorsque vous le publiez. Le brouillon reste à vous tant que vous ne l’avez pas fait.' },
  { titre: 'L’infolettre', ancre: 'newsletter', corps: 'Votre liste d’abonnées vit ici, avec ce qu’il faut pour composer et envoyer un courriel à toutes quand vous avez quelque chose à dire.' },
  { titre: 'Le journal', ancre: 'changelog', corps: 'Chaque mise à jour du site s’y explique en langage simple, pour que vous sachiez toujours ce qui a changé et quand, sans avoir à le demander.' },
  { titre: 'Partenaire Vexel', ancre: 'partenaire-vexel', corps: 'C’est ici que vous décrivez un changement que vous voulez sur votre site : il arrive directement au studio. La section porte aussi ce qu’il faut pour recommander Vexel autour de vous.' },
  { titre: 'Les paramètres', ancre: 'settings', corps: 'Les pièces que vous demandez aux clientes, les étapes de leur parcours, les sections du site qui s’allument ou s’éteignent, et l’apparence se règlent ici. Rien de ce que vous éteignez ne disparaît : ça attend que vous le rallumiez.' },
  { titre: 'Vous connaissez maintenant votre site', corps: 'Sur le site lui-même, le bouton « Modifier le site » ouvre le crayon d’édition : vous cliquez presque n’importe quel texte ou image et vous le changez sur-le-champ. Le site se lit en français et en anglais, en mode clair et en mode sombre, et chaque cliente y retrouve son dossier, ses rendez-vous, ses cours et vos messages.' },
];

export const LIBELLES_VISITE = { visite: 'Visite guidée', etape: 'Étape', precedent: 'Précédent', suivant: 'Suivant', terminer: 'Terminer', quitter: 'Quitter' };
