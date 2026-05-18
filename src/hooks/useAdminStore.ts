import { useEffect, useState, useCallback } from "react";

export type TransactionCategory =
  | "Thérapie"
  | "Atelier"
  | "Événement"
  | "Boutique"
  | "Dépense";

export interface Transaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: TransactionCategory;
}

export interface Booking {
  id: string;
  clientName: string;
  email: string;
  service: string;
  date: string;
  status: "nouvelle" | "confirmée" | "annulée";
  notes?: string;
}

export interface Message {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  registered: number;
}

export interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  published: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  joinedAt: string;
}

export interface AdminData {
  calendarEmbedSrc: string | null;
  transactions: Transaction[];
  bookings: Booking[];
  messages: Message[];
  products: Product[];
  events: EventItem[];
  posts: Post[];
  subscribers: Subscriber[];
}

const STORAGE_KEY = "ti-admin-data";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const SEED: AdminData = {
  calendarEmbedSrc: null,
  transactions: [
    { id: "t1", date: daysAgo(1), label: "Séance somatique · Marie L.", amount: 120, category: "Thérapie" },
    { id: "t2", date: daysAgo(3), label: "Atelier Ancrage · groupe", amount: 480, category: "Atelier" },
    { id: "t3", date: daysAgo(6), label: "Boutique · Essai Écrits", amount: 34, category: "Boutique" },
    { id: "t4", date: daysAgo(8), label: "Location studio", amount: -220, category: "Dépense" },
    { id: "t5", date: daysAgo(12), label: "Séance somatique · J. Perron", amount: 120, category: "Thérapie" },
    { id: "t6", date: daysAgo(15), label: "Événement Territoire · billetterie", amount: 640, category: "Événement" },
    { id: "t7", date: daysAgo(20), label: "Matériel huile essentielle", amount: -95, category: "Dépense" },
  ],
  bookings: [
    { id: "b1", clientName: "Marie Lavigne", email: "marie@example.com", service: "Séance somatique", date: daysAhead(2), status: "confirmée" },
    { id: "b2", clientName: "Julien Perron", email: "jp@example.com", service: "Accompagnement individuel", date: daysAhead(5), status: "nouvelle" },
    { id: "b3", clientName: "Sophie Tremblay", email: "stremblay@example.com", service: "Atelier Ancrage", date: daysAhead(9), status: "nouvelle" },
  ],
  messages: [
    { id: "m1", from: "Marie Lavigne", email: "marie@example.com", subject: "Reprise de séance", body: "Bonjour Elise, j'aimerais reprendre notre suivi à partir de la semaine prochaine si possible.", date: daysAgo(0), read: false },
    { id: "m2", from: "Catherine B.", email: "cat.b@example.com", subject: "Atelier en entreprise", body: "Une équipe de 12 personnes, intéressées par un atelier d'ancrage corporel. Est-ce que vous offrez ce type de prestation?", date: daysAgo(2), read: false },
    { id: "m3", from: "Librairie des Sentiers", email: "contact@sentiers.ca", subject: "Partenariat Écrits", body: "Bonjour, on aimerait discuter d'une collaboration pour la mise en avant de vos écrits.", date: daysAgo(5), read: true },
  ],
  products: [
    { id: "p1", title: "Écrits · recueil I", price: 24, stock: 42, active: true },
    { id: "p2", title: "Carnet somatique", price: 18, stock: 0, active: true },
    { id: "p3", title: "Huile d'ancrage · 30ml", price: 32, stock: 17, active: true },
  ],
  events: [
    { id: "e1", title: "Territoire incarné · journée complète", date: daysAhead(14), location: "Studio Outremont", capacity: 20, registered: 11 },
    { id: "e2", title: "Ancrage & mouvement", date: daysAhead(28), location: "En ligne", capacity: 40, registered: 6 },
  ],
  posts: [
    { id: "po1", title: "Habiter son corps", date: daysAgo(10), excerpt: "Une pratique de retour au sol, pensée pour les jours gris.", published: true },
    { id: "po2", title: "Le territoire comme maître", date: daysAgo(30), excerpt: "Ce que m'ont appris les forêts boréales sur la limite du soi.", published: true },
    { id: "po3", title: "Brouillon · cartographie", date: today(), excerpt: "Esquisse d'un chapitre sur la cartographie sensorielle.", published: false },
  ],
  subscribers: [
    { id: "s1", email: "marie@example.com", name: "Marie Lavigne", joinedAt: daysAgo(60) },
    { id: "s2", email: "jp@example.com", name: "Julien Perron", joinedAt: daysAgo(45) },
    { id: "s3", email: "cat.b@example.com", name: "Catherine B.", joinedAt: daysAgo(20) },
    { id: "s4", email: "annic.r@example.com", joinedAt: daysAgo(15) },
    { id: "s5", email: "paulette@example.com", name: "Paulette M.", joinedAt: daysAgo(4) },
  ],
};

const readInitial = (): AdminData => {
  if (typeof window === "undefined") return SEED;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw);
    return { ...SEED, ...parsed };
  } catch {
    return SEED;
  }
};

export const useAdminStore = () => {
  const [data, setData] = useState<AdminData>(readInitial);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback(<K extends keyof AdminData>(key: K, value: AdminData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  }, []);

  const reset = useCallback(() => setData(SEED), []);

  return { data, setData, update, reset };
};
