import type { Timestamp } from "firebase/firestore";

/** What kind of activity this availability window is reserved for.
 *  Drives the color in the calendar UI. */
export type AvailabilityCategory = "consultation" | "danse";

/** Recurring weekly availability OR one-off date. Times in HH:mm Montreal local. */
export interface AvailabilitySlot {
  id: string;
  /** 0 = Sunday, 1 = Monday … 6 = Saturday. Set when recurring=true. */
  dayOfWeek?: number;
  /** ISO yyyy-mm-dd. Set when recurring=false (one-off). */
  date?: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  recurring: boolean;
  active: boolean;
  /** Defaults to "consultation" if missing on legacy docs. */
  category?: AvailabilityCategory;
  createdAt: Timestamp | null;
}

/** Tailwind class strings for each block kind, kept in one place. */
export const BLOCK_COLORS = {
  availabilityConsultation:
    "bg-rose-200/40 dark:bg-rose-300/15 border-rose-400/60 text-rose-900 dark:text-rose-100",
  availabilityDanse:
    "bg-orange-200/40 dark:bg-orange-300/15 border-orange-400/60 text-orange-900 dark:text-orange-100",
  appointmentConfirmed:
    "bg-rust/15 dark:bg-rust/30 border-rust text-ink dark:text-stone-100",
  appointmentRequested:
    "bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-800 dark:text-amber-200",
  appointmentCancelled:
    "bg-stone-200 dark:bg-stone-800 border-stone-300 text-stone-500 line-through opacity-60",
  personal:
    "bg-sky-200/50 dark:bg-sky-300/15 border-sky-400/60 text-sky-900 dark:text-sky-100 italic",
} as const;

export const colorForAvailability = (a: AvailabilitySlot): string =>
  a.category === "danse" ? BLOCK_COLORS.availabilityDanse : BLOCK_COLORS.availabilityConsultation;

export const colorForAppointment = (status: string): string =>
  status === "cancelled" ? BLOCK_COLORS.appointmentCancelled :
  status === "requested" ? BLOCK_COLORS.appointmentRequested :
  BLOCK_COLORS.appointmentConfirmed;

export type AppointmentStatus = "requested" | "confirmed" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  clientUid: string;
  clientName: string;
  clientEmail: string;
  start: Timestamp;
  end: Timestamp;
  durationMin: number;
  status: AppointmentStatus;
  type?: string; // e.g. "consultation", "soin somatique"
  notes?: string;
  meetingUrl?: string;
  createdBy: "client" | "admin";
  createdAt: Timestamp | null;
}

export interface PersonalEvent {
  id: string;
  title: string;
  start: Timestamp;
  end: Timestamp;
  notes?: string;
  createdAt: Timestamp | null;
}
