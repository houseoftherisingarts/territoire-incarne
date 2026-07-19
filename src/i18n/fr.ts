import {
  IMG_THERAPIE,
  IMG_WRITINGS,
  ELISE_FIELD_IMG,
} from "../assets/images";

export const fr = {
  general: {
    close: "Fermer",
    addToCart: "Ajouter",
    cartTotal: "Panier",
    articles: "articles",
    shipping: "Livraison",
    checkout: "Commander",
    name: "Nom",
    address: "Adresse",
    email: "Courriel",
    sendOrder: "Envoyer la commande",
    cartEmpty: "Votre panier est vide.",
    shippingCost: "30$",
    clientSpace: "Votre espace client",
    myClientSpace: "Mon espace",
  },
  nav: {
    apropos: "À propos",
    mouvement: "Mouvement",
    therapie: "Thérapie",
    education: "Éducation",
    events: "Événements",
    boutique: "Boutique",
    writings: "Écrits",
    connecter: "Connecter",
    ressources: "Ressources",
  },
  sections: {
    apropos: {
      title: "À propos",
      intro:
        "Elise G. Lortie tisse des espaces où le corps redevient un territoire de vérité. Thérapeute somatique et artiste, elle accompagne le retour au sensible par le mouvement, la parole et le silence.",
      longText:
        "Notre méthode repose sur la conviction que le corps détient sa propre sagesse. À travers une écoute profonde des fascias, du système nerveux et des impulsions subtiles, nous apprenons à naviguer les paysages intérieurs avec douceur. Ce n'est pas une correction de ce qui est brisé, mais une révélation de ce qui est déjà entier. Nous cultivons la lenteur comme un acte de résistance, permettant à l'intégration de se faire au rythme organique du vivant.",
    },
    mouvement: {
      title: "Le Corps en Mouvement",
      intro:
        "L'approche est lente, à l'écoute des rythmes internes. Nous ne dansons pas pour être vus, mais pour être sentis.",
      practices: [
        "Danse-Baladi & Gypsie (Troupe)",
        "Whirling (Performance & Méditation)",
        "Improvisation & Continuum",
        "Yoga & Régulation du système nerveux",
      ],
      extra: "Liste de lecture audio disponible",
      cta: "S'inscrire au prochain cycle",
      formTitle: "Inscription au prochain cours",
      formName: "Nom complet",
      formEmail: "Courriel",
      formCourse: "Choix du cours",
      formCity: "Lieu",
      formBtn: "S'inscrire",
      groupTitle: "Groupes & Privés",
      groupText: "Booker un cours pour votre groupe",
      groupBtn: "Faire une demande",
    },
    therapie: {
      title: "Soin Somatique",
      intro:
        "Une approche pour guérir les traumas et retrouver la sécurité. Un espace pour déposer ce qui est lourd et renouer avec sa vitalité.",
      locations: [
        { type: "En Ligne", desc: "Via Zoom, dans le confort de votre foyer." },
        { type: "Présentiel", desc: "Au studio ou à domicile." },
      ],
      pricingTitle: "Modèle de Contribution",
      pricing: [
        { name: "Contribution Suggérée", desc: "Couvre les frais de base et soutient la pratique." },
        { name: "Participation Solidaire", desc: "Être parrainé·e si les ressources sont limitées." },
        { name: "Contribution Généreuse", desc: "Parrainer quelqu'un qui a moins de ressources." },
        { name: "Troc Conscient", desc: "Contribution en nature ou échange de services." },
      ],
      consultationTitle: "Demande de Consultation",
      consultationIntro: "Pour prendre rendez-vous ou valider si l'approche vous convient.",
      formName: "Nom",
      formEmail: "Courriel",
      formPhone: "Téléphone",
      formMsg: "Message (Optionnel)",
      formBtn: "Envoyer la demande",
    },
    education: {
      title: "Éducation",
      intro: "Un hub de ressources pour déconstruire les tabous et cultiver le consentement.",
      bookConfTitle: "Conférences",
      bookConfText: "Réserver une conférence pour votre organisation",
      bookConfBtn: "Me contacter",
      tabs: [
        { title: "Conférences", content: ["Conférence sur l'attachement & Trauma", "La diversité & le droit de jouir"] },
        { title: "Pratiques", content: ["Yoni Massage & Soin du sexe féminin", "Célébration Sexuelle Consensuelle"] },
        { title: "En Ligne", content: ["Ateliers en ligne & Webinaire", "Cercles de parole virtuels"] },
      ],
      videoSection: {
        title: "Vidéos à la carte",
        items: [
          { title: "Introduction à l'Anatomie Sensible", price: "45$", desc: "Exploration guidée du bassin et des fascias. (45 min)", img: IMG_WRITINGS },
          { title: "Auto-Massage du Ventre", price: "30$", desc: "Pratique douce pour la digestion émotionnelle. (30 min)", img: IMG_THERAPIE },
          { title: "Rituel du Matin", price: "15$", desc: "Mise en mouvement pour réveiller le corps. (15 min)", img: ELISE_FIELD_IMG },
        ],
      },
    },
    events: {
      title: "Événements",
      intro: "Retraites immersives et cercles de pratique pour plonger dans la matière.",
    },
    boutique: {
      title: "Boutique",
      intro: "Des outils simples pour accompagner votre pratique. Frais de livraison fixes de 30$.",
    },
    writings: {
      title: "Écrits",
      intro: "Réflexions sur la lenteur, l'anatomie et le vivant.",
    },
    connecter: {
      title: "Connecter",
      intro: "Pour recevoir des nouvelles douces, dates de retraite et festivals.",
      placeholder: "Votre courriel",
      btn: "S'inscrire",
    },
    ressources: {
      title: "Ressources",
      intro: "Outils, lectures et soutiens pour accompagner votre cheminement.",
      categories: [
        {
          title: "Documents",
          icon: "Download",
          items: [
            { label: "Guide d'auto-régulation (PDF)", link: "#" },
            { label: "Charte du consentement (PDF)", link: "#" },
            { label: "Carte des émotions (IMG)", link: "#" },
          ],
        },
        {
          title: "Lignes d'écoute",
          icon: "Phone",
          items: [
            { label: "SOS violence conjugale", link: "tel:18003639010" },
            { label: "Tel-Jeunes", link: "tel:18002632266" },
            { label: "Suicide Action", link: "tel:18662773553" },
          ],
        },
        {
          title: "Lectures suggérées",
          icon: "Book",
          items: [
            { label: "Le corps n'oublie rien — Bessel van der Kolk", link: "#" },
            { label: "Réveiller le tigre — Peter Levine", link: "#" },
            { label: "The Body is Not an Apology — Sonya Renee Taylor", link: "#" },
          ],
        },
        {
          title: "Liens web",
          icon: "Globe",
          items: [
            { label: "Trauma Healing (SE Institute)", link: "https://traumahealing.org" },
            { label: "NARM Training Institute", link: "https://narmtraining.com" },
          ],
        },
      ],
    },
  },
};

export type Content = typeof fr;
