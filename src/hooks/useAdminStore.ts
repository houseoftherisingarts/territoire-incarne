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

const SEED: AdminData = {
  calendarEmbedSrc: null,
  transactions: [],
  bookings: [],
  messages: [],
  products: [],
  events: [],
  posts: [],
  subscribers: [],
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
