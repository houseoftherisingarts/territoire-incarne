import {
  IMG_THERAPIE,
  IMG_WRITINGS,
  ELISE_FIELD_IMG,
} from "../assets/images";
import type { Content } from "./fr";

export const en: Content = {
  general: {
    close: "Close",
    addToCart: "Add",
    cartTotal: "Cart",
    articles: "items",
    shipping: "Shipping",
    checkout: "Checkout",
    name: "Name",
    address: "Address",
    email: "Email",
    sendOrder: "Send order",
    cartEmpty: "Your cart is empty.",
    shippingCost: "$30",
    clientSpace: "Your client space",
    myClientSpace: "My space",
  },
  nav: {
    apropos: "About",
    mouvement: "Movement",
    therapie: "Therapy",
    education: "Education",
    events: "Events",
    boutique: "Shop",
    writings: "Writings",
    connecter: "Connect",
    ressources: "Resources",
  },
  sections: {
    apropos: {
      title: "About",
      intro:
        "Elise G. Lortie weaves spaces where the body becomes a territory of truth again. A somatic therapist and artist, she accompanies the return to the sensible through movement, voice, and silence.",
      longText:
        "Our method rests on the conviction that the body holds its own wisdom. Through deep listening to fascia, the nervous system, and subtle impulses, we learn to navigate inner landscapes with gentleness. This is not a correction of what is broken, but a revelation of what is already whole. We cultivate slowness as an act of resistance, letting integration unfold at the organic rhythm of the living.",
    },
    mouvement: {
      title: "The Body in Motion",
      intro:
        "The approach is slow, attuned to inner rhythms. We don't dance to be seen, but to be felt.",
      practices: [
        "Baladi & Gypsy Dance (Troupe)",
        "Whirling (Performance & Meditation)",
        "Improvisation & Continuum",
        "Yoga & Nervous System Regulation",
      ],
      extra: "Audio playlist available",
      cta: "Register for the next cycle",
      formTitle: "Register for the next class",
      formName: "Full name",
      formEmail: "Email",
      formCourse: "Class",
      formCity: "Location",
      formBtn: "Register",
      groupTitle: "Groups & Private",
      groupText: "Book a class for your group",
      groupBtn: "Request",
    },
    therapie: {
      title: "Somatic Care",
      intro:
        "An approach to heal trauma and rebuild safety. A space to set down what is heavy and reconnect with vitality.",
      servicesList: [
        {
          title: "Resensitization Care",
          short: "Body & Organs",
          desc: "Gentle support to restore sensitivity and safety in the body and sexual organs. This work releases traumatic memories held in the tissues.",
          image: IMG_THERAPIE,
        },
        {
          title: "Peer Counseling",
          short: "Peer support",
          desc: "A space of horizontal listening and resonance. No caregiver–patient hierarchy — a shared humanity where truth can be set down without judgment.",
          image: ELISE_FIELD_IMG,
        },
      ],
      locations: [
        { type: "Online", desc: "Via Zoom, from the comfort of your home." },
        { type: "In Person", desc: "At the studio or at home." },
      ],
      pricingTitle: "Contribution Model",
      pricing: [
        { name: "Suggested Contribution", desc: "Covers base costs and supports the practice." },
        { name: "Solidarity Rate", desc: "Be sponsored when resources are limited." },
        { name: "Generous Contribution", desc: "Sponsor someone with fewer resources." },
        { name: "Conscious Barter", desc: "In-kind contribution or service exchange." },
      ],
      consultationTitle: "Consultation Request",
      consultationIntro: "To book a session or see if the approach suits you.",
      formName: "Name",
      formEmail: "Email",
      formPhone: "Phone",
      formMsg: "Message (optional)",
      formBtn: "Send request",
    },
    education: {
      title: "Education",
      intro: "A hub of resources to undo taboo and cultivate consent.",
      bookConfTitle: "Talks",
      bookConfText: "Book a talk for your organization",
      bookConfBtn: "Contact me",
      tabs: [
        { title: "Talks", content: ["Attachment & Trauma talk", "Diversity & the right to pleasure"] },
        { title: "Practices", content: ["Yoni Massage & Female Sexual Care", "Consensual Sexual Celebration"] },
        { title: "Online", content: ["Online workshops & webinars", "Virtual sharing circles"] },
      ],
      videoSection: {
        title: "Videos on demand",
        items: [
          { title: "Intro to Sensible Anatomy", price: "$45", desc: "Guided exploration of the pelvis and fascia. (45 min)", img: IMG_WRITINGS },
          { title: "Belly Self-Massage", price: "$30", desc: "Gentle practice for emotional digestion. (30 min)", img: IMG_THERAPIE },
          { title: "Morning Ritual", price: "$15", desc: "Movement to awaken the body. (15 min)", img: ELISE_FIELD_IMG },
        ],
      },
    },
    events: {
      title: "Events",
      intro: "Immersive retreats and practice circles to dive into matter.",
      eventsList: [
        { date: "Sept 12–14", title: "Retreat: The Silence of Bones", loc: "Val-David", full: false },
        { date: "Oct 25", title: "Circle: Voice & Belly", loc: "Mont-Tremblant", full: true },
        { date: "November", title: "Immersion: Whirling Dervish", loc: "Ripon", full: false },
      ],
      historyTitle: "Archives",
      historyList: [
        { date: "Summer 2023", title: "Sacred Feminine Festival", loc: "Brocéliande" },
        { date: "Winter 2022", title: "Retreat: Deep Roots", loc: "Sainte-Lucie" },
      ],
    },
    boutique: {
      title: "Shop",
      intro: "Simple tools to support your practice. Flat $30 shipping.",
      categories: [
        {
          name: "Yoni Steam",
          items: [
            { name: "Herbs", price: 25, desc: "Blend for menopause and postpartum.", img: IMG_BOUTIQUE },
            { name: "Artisan Benches", price: 150, desc: "Handmade from local wood.", img: IMG_ZEN_STONE },
            { name: "Ritual Bowls", price: 45, desc: "Hand-thrown ceramic.", img: IMG_BOUTIQUE },
          ],
        },
        {
          name: "Stones & Tools",
          items: [
            { name: "Jade Eggs", price: 55, desc: "Certified nephrite jade for practice.", img: IMG_ZEN_STONE },
            { name: "Obsidian", price: 60, desc: "Stone of truth and grounding.", img: IMG_BOUTIQUE },
            { name: "Ceramic Dildos", price: 85, desc: "Soft-ceramic body art.", img: IMG_ZEN_STONE },
          ],
        },
        {
          name: "Body Care",
          items: [
            { name: "Ecstatic Honey", price: 20, desc: "Honey infused with aphrodisiac herbs.", img: IMG_BOUTIQUE },
            { name: "Sacred Oils", price: 35, desc: "Anointing for body and soul.", img: IMG_ZEN_STONE },
          ],
        },
        {
          name: "Art & Culture",
          items: [
            { name: "Art Prints", price: 40, desc: "Yoni art prints on archival paper.", img: IMG_BOUTIQUE },
            { name: "Album", price: 25, desc: "Sacred chants for practice.", img: IMG_ZEN_STONE },
          ],
        },
      ],
    },
    writings: {
      title: "Writings",
      intro: "Reflections on slowness, anatomy, and the living.",
      posts: [
        { date: "Anatomy", title: "The Clitoris: Underground Temple" },
        { date: "Ecology", title: "Fruit of the Earth: The Famous Condoms" },
        { date: "Reflection", title: "True Self Temple: Abundance & Safety" },
      ],
    },
    connecter: {
      title: "Connect",
      intro: "For gentle news, retreat dates, and festivals.",
      placeholder: "Your email",
      btn: "Subscribe",
    },
    ressources: {
      title: "Resources",
      intro: "Tools, readings and supports for your journey.",
      categories: [
        {
          title: "Documents",
          icon: "Download",
          items: [
            { label: "Self-Regulation Guide (PDF)", link: "#" },
            { label: "Consent Charter (PDF)", link: "#" },
            { label: "Emotion Map (IMG)", link: "#" },
          ],
        },
        {
          title: "Helplines",
          icon: "Phone",
          items: [
            { label: "Domestic Violence SOS", link: "tel:18003639010" },
            { label: "Tel-Jeunes", link: "tel:18002632266" },
            { label: "Suicide Action", link: "tel:18662773553" },
          ],
        },
        {
          title: "Suggested Reading",
          icon: "Book",
          items: [
            { label: "The Body Keeps the Score — Bessel van der Kolk", link: "#" },
            { label: "Waking the Tiger — Peter Levine", link: "#" },
            { label: "The Body is Not an Apology — Sonya Renee Taylor", link: "#" },
          ],
        },
        {
          title: "Web Links",
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
