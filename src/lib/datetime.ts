/** Datetime helpers for the calendar. Times are stored UTC in Firestore;
 *  rendered in America/Montreal in the UI. */

export const MONTREAL_TZ = "America/Montreal";

const dateFmt = new Intl.DateTimeFormat("fr-CA", {
  timeZone: MONTREAL_TZ,
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortDateFmt = new Intl.DateTimeFormat("fr-CA", {
  timeZone: MONTREAL_TZ,
  day: "2-digit",
  month: "short",
});


const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: MONTREAL_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const fmtDateLong = (d: Date) => dateFmt.format(d);
export const fmtDateShort = (d: Date) => shortDateFmt.format(d);
export const fmtTime = (d: Date) => {
  const { h, m } = montrealHM(d);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Robust Montreal-local hour/minute extraction. Use this instead of parsing
 *  fmtTime() output — fr-CA locale can return "9 h 00" instead of "09:00"
 *  depending on the browser's ICU version. */
export const montrealHM = (d: Date): { h: number; m: number } => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: MONTREAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) parts[p.type] = p.value;
  // en-US 24h can return "24" for midnight — normalize to 0.
  const h = parseInt(parts.hour, 10) % 24;
  const m = parseInt(parts.minute, 10);
  return { h, m };
};
/** yyyy-mm-dd in Montreal local. */
export const isoDate = (d: Date) => isoDateFmt.format(d);

/** Parse an ISO yyyy-mm-dd as a date at midnight Montreal time. */
export const parseIsoDateMontreal = (iso: string): Date => {
  // Construct from parts to avoid local-tz interpretation surprises.
  // Montreal is UTC-5 (EST) or UTC-4 (EDT).
  const [y, m, d] = iso.split("-").map(Number);
  // We just need a Date that, when formatted in Montreal, prints `iso` and 00:00.
  // Easiest: create at noon UTC on that date — safe across DST shifts.
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
};

/** Combine a yyyy-mm-dd date and "HH:mm" time into a UTC Date,
 *  treating the inputs as Montreal-local time. */
export const combineMontrealDateTime = (isoDateStr: string, timeStr: string): Date => {
  const [y, m, d] = isoDateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);

  // Build a date in UTC, then shift by Montreal's offset for that instant.
  // Use the trick: format the candidate date in Montreal and adjust.
  let candidate = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: MONTREAL_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(candidate);
  const parts: Record<string, string> = {};
  for (const p of formatted) parts[p.type] = p.value;
  const seenH = parseInt(parts.hour, 10);
  const seenMin = parseInt(parts.minute, 10);
  // Diff in minutes between desired Montreal HH:mm and what UTC produced
  const diffMin = (h * 60 + min) - (seenH * 60 + seenMin);
  candidate = new Date(candidate.getTime() + diffMin * 60_000);
  return candidate;
};

/** Day of week in Montreal time (0 = Sunday). */
export const dayOfWeekMontreal = (d: Date): number => {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: MONTREAL_TZ, weekday: "short" });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[fmt.format(d)] ?? 0;
};

export const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

/** Generate half-hour slot times across a day, e.g. ["00:00","00:30",…,"23:30"] */
export const halfHourSlots = (): string[] => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
};

/** Parse "HH:mm" → minutes since midnight. */
export const minOfDay = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Add minutes to "HH:mm" → "HH:mm" */
export const addMin = (hhmm: string, mins: number): string => {
  const total = minOfDay(hhmm) + mins;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
