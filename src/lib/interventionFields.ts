/** Per-category field configs for the InterventionRequestModal.
 *  Each category renders a different form; data is stored as a flexible
 *  `details: Record<string, string>` on the interventionRequests doc. */

export type InterventionCategory = "danse" | "education" | "events" | "therapie";

export type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "number";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  min?: number;
  placeholder?: string;
  helpText?: string;
  /** Conditionally show this field based on other answers. */
  showIf?: (values: Record<string, string>) => boolean;
}

export interface CategoryConfig {
  id: InterventionCategory;
  label: string;        // admin label
  ctaLabel: string;     // public button label
  ctaSubtitle?: string; // small line under CTA button
  modalTitle: string;
  intro: string;        // shown at top of form
  fields: FieldDef[];
}

// ─── Common identity fields used by every form ────────────────────────────

const IDENTITY_FIELDS: FieldDef[] = [
  { name: "name",  label: "Nom complet",     type: "text",  required: true },
  { name: "email", label: "Courriel",        type: "email", required: true },
  { name: "phone", label: "Téléphone (facultatif)", type: "tel" },
  { name: "org",   label: "Organisation / lieu (facultatif)", type: "text",
    helpText: "Nom de votre école, festival, entreprise, studio, etc." },
];

// ─── Mouvement / Danse ────────────────────────────────────────────────────

const DANSE: CategoryConfig = {
  id: "danse",
  label: "Cours de danse",
  ctaLabel: "Demander un cours",
  ctaSubtitle: "Groupe ou privé",
  modalTitle: "Demander un cours de danse",
  intro:
    "Que ce soit un groupe en région ou un suivi privé, écrivez-moi quelques détails et je reviendrai vers vous bientôt.",
  fields: [
    ...IDENTITY_FIELDS,
    {
      name: "format",
      label: "Type de cours",
      type: "select",
      required: true,
      options: [
        "Cours de groupe (minimum 10 personnes)",
        "Privé · 1-on-1 — Forfait 4 cours (500 $)",
        "Privé · 1-on-1 — Forfait 8 cours (800 $)",
      ],
    },
    // Group fields
    {
      name: "city",
      label: "Ville / lieu prévu",
      type: "text",
      required: true,
      placeholder: "Ex. Mont-Tremblant, Ripon…",
      showIf: (v) => v.format === "Cours de groupe (minimum 10 personnes)",
    },
    {
      name: "groupSize",
      label: "Nombre de personnes prévu",
      type: "number",
      required: true,
      min: 10,
      helpText: "Minimum 10 personnes pour un cours de groupe.",
      showIf: (v) => v.format === "Cours de groupe (minimum 10 personnes)",
    },
    {
      name: "venue",
      label: "Avez-vous un studio / une salle ?",
      type: "text",
      placeholder: "Oui (nom et adresse) / Non, à organiser",
      showIf: (v) => v.format === "Cours de groupe (minimum 10 personnes)",
    },
    // Private fields
    {
      name: "level",
      label: "Niveau",
      type: "select",
      options: ["Débutante", "Intermédiaire", "Avancée", "Mixte"],
      showIf: (v) => v.format?.startsWith("Privé") ?? false,
    },
    // Common
    {
      name: "preferredDates",
      label: "Dates ou période souhaitée",
      type: "text",
      placeholder: "Ex. semaine du 15 juin, samedis d'automne…",
    },
    {
      name: "message",
      label: "Notes, intentions, questions",
      type: "textarea",
    },
  ],
};

// ─── Éducation ────────────────────────────────────────────────────────────

const EDUCATION: CategoryConfig = {
  id: "education",
  label: "Éducation / interventions",
  ctaLabel: "Demander une intervention",
  ctaSubtitle: "École, festival, conférence…",
  modalTitle: "Demander une intervention éducative",
  intro:
    "Conférence, séminaire, formation pour un groupe — décrivez-moi le contexte et l'intention. Je vous propose une formule sur mesure.",
  fields: [
    ...IDENTITY_FIELDS,
    {
      name: "interventionType",
      label: "Type d'intervention",
      type: "select",
      required: true,
      options: [
        "École (primaire)",
        "École (secondaire)",
        "École (collégial / cégep)",
        "École (universitaire)",
        "Festival",
        "Groupe professionnel / entreprise",
        "Conférence publique",
        "Séminaire / formation",
        "Cercle / groupe d'études",
        "Autre",
      ],
    },
    {
      name: "topic",
      label: "Sujet ou thème souhaité",
      type: "textarea",
      required: true,
      placeholder: "Ex. somatique en milieu scolaire, écoute du corps, consentement, ancrage…",
    },
    {
      name: "audienceSize",
      label: "Taille du public prévu",
      type: "number",
      placeholder: "Ex. 30",
    },
    {
      name: "audienceProfile",
      label: "Profil du public",
      type: "text",
      placeholder: "Ex. enseignants, jeunes 14-17 ans, professionnel·les de la santé…",
    },
    {
      name: "format",
      label: "Format souhaité",
      type: "select",
      options: ["Présentiel", "En ligne", "Hybride", "À discuter"],
    },
    {
      name: "duration",
      label: "Durée prévue",
      type: "text",
      placeholder: "Ex. 90 min, demi-journée, 2 jours…",
    },
    {
      name: "preferredDates",
      label: "Date(s) souhaitée(s)",
      type: "text",
      placeholder: "Ex. trimestre d'automne, semaine du 12 octobre…",
    },
    {
      name: "budget",
      label: "Budget envisagé (facultatif)",
      type: "text",
      placeholder: "À discuter ou fourchette",
    },
    {
      name: "message",
      label: "Contexte, intention, questions",
      type: "textarea",
    },
  ],
};

// ─── Événements ───────────────────────────────────────────────────────────

const EVENTS: CategoryConfig = {
  id: "events",
  label: "Événements sur mesure",
  ctaLabel: "Proposer un événement",
  ctaSubtitle: "Atelier, retraite, cérémonie…",
  modalTitle: "Proposer un événement",
  intro:
    "Vous avez une idée d'événement où vous souhaitez ma présence — atelier, retraite, cérémonie, festival ? Décrivez-moi votre vision.",
  fields: [
    ...IDENTITY_FIELDS,
    {
      name: "eventType",
      label: "Type d'événement",
      type: "select",
      required: true,
      options: [
        "Atelier (1 séance)",
        "Série d'ateliers",
        "Retraite (1 jour)",
        "Retraite (week-end)",
        "Retraite (plusieurs jours)",
        "Cérémonie",
        "Conférence",
        "Festival",
        "Événement corporatif",
        "Autre / sur mesure",
      ],
    },
    {
      name: "theme",
      label: "Thème / intention de l'événement",
      type: "textarea",
      required: true,
      placeholder: "Quelle expérience souhaitez-vous offrir aux participants ?",
    },
    {
      name: "expectedAttendance",
      label: "Nombre de participants prévu",
      type: "number",
      placeholder: "Ex. 25",
    },
    {
      name: "audienceProfile",
      label: "Profil des participants",
      type: "text",
      placeholder: "Ex. femmes en transition, équipe de soignants, communauté locale…",
    },
    {
      name: "preferredDates",
      label: "Date(s) souhaitée(s)",
      type: "text",
      placeholder: "Ex. printemps 2027, week-end de juin…",
    },
    {
      name: "duration",
      label: "Durée prévue",
      type: "text",
      placeholder: "Ex. 3 h, 2 jours, 5 jours…",
    },
    {
      name: "location",
      label: "Lieu / région",
      type: "text",
      placeholder: "Ex. Outaouais, Estrie, en ligne, à déterminer ensemble",
    },
    {
      name: "logistics",
      label: "Hébergement, repas, espace — déjà organisé ?",
      type: "textarea",
      placeholder: "Décrivez ce qui est déjà en place ou à organiser",
    },
    {
      name: "budget",
      label: "Budget envisagé (facultatif)",
      type: "text",
    },
    {
      name: "message",
      label: "Vision, intentions, questions",
      type: "textarea",
    },
  ],
};

// ─── Thérapie groupe / entreprise (bonus) ─────────────────────────────────

const THERAPIE: CategoryConfig = {
  id: "therapie",
  label: "Soins en groupe / corporatif",
  ctaLabel: "Soin pour un groupe",
  ctaSubtitle: "Entreprise, équipe, collectif",
  modalTitle: "Demander un soin somatique pour un groupe",
  intro:
    "Pour les soins individuels, créez votre espace client. Ce formulaire est pour les soins de groupe ou les contextes corporatifs / collectifs.",
  fields: [
    ...IDENTITY_FIELDS,
    {
      name: "context",
      label: "Contexte",
      type: "select",
      required: true,
      options: [
        "Entreprise / équipe de travail",
        "Groupe communautaire",
        "Cercle de femmes",
        "Cercle thérapeutique",
        "Retraite collective",
        "Autre",
      ],
    },
    {
      name: "groupSize",
      label: "Taille du groupe",
      type: "number",
      placeholder: "Ex. 12",
    },
    {
      name: "intent",
      label: "Intention du soin",
      type: "textarea",
      required: true,
      placeholder: "Qu'est-ce que vous cherchez à offrir au groupe ?",
    },
    {
      name: "preferredDates",
      label: "Date(s) souhaitée(s)",
      type: "text",
    },
    {
      name: "location",
      label: "Lieu",
      type: "text",
    },
    {
      name: "message",
      label: "Notes, questions",
      type: "textarea",
    },
  ],
};

export const INTERVENTION_CONFIGS: Record<InterventionCategory, CategoryConfig> = {
  danse: DANSE,
  education: EDUCATION,
  events: EVENTS,
  therapie: THERAPIE,
};
