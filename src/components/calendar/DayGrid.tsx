import { useMemo, useRef, useEffect } from "react";
import {
  combineMontrealDateTime,
  dayOfWeekMontreal,
  fmtTime,
  halfHourSlots,
  isoDate,
  montrealHM,
} from "../../lib/datetime";
import {
  BLOCK_COLORS, colorForAppointment, colorForAvailability,
  type Appointment, type AvailabilitySlot, type PersonalEvent,
} from "../../types/calendar";

export interface GridBlock {
  id: string;
  kind: "appointment" | "personal" | "available";
  start: Date;
  end: Date;
  label: string;
  sublabel?: string;
  color: string; // tailwind classes for bg + border + text
  data?: Appointment | PersonalEvent | AvailabilitySlot;
}

interface Props {
  date: Date; // any moment on the day to render
  startHour?: number; // default 8
  endHour?: number;   // default 21
  appointments?: Appointment[];
  personalEvents?: PersonalEvent[];
  availability?: AvailabilitySlot[];
  /** Show available windows as background blocks. */
  showAvailability?: boolean;
  onSlotClick?: (start: Date, end: Date) => void;
  onBlockClick?: (block: GridBlock) => void;
}

const SLOT_HEIGHT_PX = 32; // each half-hour row

export const DayGrid = ({
  date,
  startHour = 8,
  endHour = 21,
  appointments = [],
  personalEvents = [],
  availability = [],
  showAvailability = true,
  onSlotClick,
  onBlockClick,
}: Props) => {
  const slots = useMemo(() => halfHourSlots().filter((t) => {
    const [h] = t.split(":").map(Number);
    return h >= startHour && h < endHour;
  }), [startHour, endHour]);

  const dateIso = isoDate(date);

  // Build all blocks for this day
  const blocks = useMemo<GridBlock[]>(() => {
    const out: GridBlock[] = [];

    // Availability blocks (background)
    if (showAvailability) {
      const dow = dayOfWeekMontreal(date);
      for (const a of availability) {
        if (!a.active) continue;
        const matches = a.recurring
          ? a.dayOfWeek === dow
          : a.date === dateIso;
        if (!matches) continue;
        out.push({
          id: `avail-${a.id}`,
          kind: "available",
          start: combineMontrealDateTime(dateIso, a.startTime),
          end: combineMontrealDateTime(dateIso, a.endTime),
          label: a.category === "danse" ? "Danse" : "Disponible",
          color: colorForAvailability(a),
          data: a,
        });
      }
    }

    // Appointments
    for (const ap of appointments) {
      const start = ap.start.toDate();
      const end = ap.end.toDate();
      if (isoDate(start) !== dateIso) continue;
      out.push({
        id: `appt-${ap.id}`,
        kind: "appointment",
        start,
        end,
        label: ap.clientName || ap.clientEmail || "Rendez-vous",
        sublabel: ap.type,
        color: colorForAppointment(ap.status),
        data: ap,
      });
    }

    // Personal events
    for (const ev of personalEvents) {
      const start = ev.start.toDate();
      const end = ev.end.toDate();
      if (isoDate(start) !== dateIso) continue;
      out.push({
        id: `personal-${ev.id}`,
        kind: "personal",
        start,
        end,
        label: ev.title,
        color: BLOCK_COLORS.personal,
        data: ev,
      });
    }
    return out;
  }, [appointments, personalEvents, availability, showAvailability, date, dateIso]);

  const gridRef = useRef<HTMLDivElement>(null);
  // Scroll to a sensible default (9am) on mount
  useEffect(() => {
    if (!gridRef.current) return;
    const target = (9 - startHour) * 2 * SLOT_HEIGHT_PX;
    gridRef.current.scrollTop = Math.max(0, target);
  }, [startHour]);

  const positionFor = (b: GridBlock): { top: number; height: number } => {
    const s = montrealHM(b.start);
    const e = montrealHM(b.end);
    const sLocal = s.h * 60 + s.m;
    const eLocal = e.h * 60 + e.m;
    const top = ((sLocal - startHour * 60) / 30) * SLOT_HEIGHT_PX;
    const height = Math.max(SLOT_HEIGHT_PX * 0.8, ((eLocal - sLocal) / 30) * SLOT_HEIGHT_PX);
    return { top, height };
  };

  return (
    <div
      ref={gridRef}
      className="relative border border-stone-200 dark:border-white/10 rounded-2xl bg-paper dark:bg-stone-900/40 overflow-y-auto max-h-[70vh]"
    >
      <div className="relative" style={{ height: `${slots.length * SLOT_HEIGHT_PX}px` }}>
        {/* Hour rows */}
        {slots.map((t, i) => {
          const isHour = t.endsWith(":00");
          const slotStart = combineMontrealDateTime(dateIso, t);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60_000);
          return (
            <button
              key={t}
              onClick={() => onSlotClick?.(slotStart, slotEnd)}
              className={`absolute left-0 right-0 flex items-start gap-3 px-3 text-xs hover:bg-stone-100 dark:hover:bg-white/5 transition-colors ${
                isHour ? "border-t border-stone-300 dark:border-white/15" : "border-t border-stone-200/50 dark:border-white/5"
              }`}
              style={{ top: `${i * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
            >
              <span className={`shrink-0 w-12 text-right font-mono ${isHour ? "opacity-70" : "opacity-30"}`}>
                {isHour ? t : ""}
              </span>
            </button>
          );
        })}

        {/* Blocks layered on top */}
        {blocks.map((b) => {
          const { top, height } = positionFor(b);
          if (top < 0 || top > slots.length * SLOT_HEIGHT_PX) return null;
          const z = b.kind === "available" ? 1 : 5;
          const widthOffset = b.kind === "available" ? 0 : 0;
          return (
            <button
              key={b.id}
              onClick={() => onBlockClick?.(b)}
              className={`absolute left-16 right-2 rounded-lg border px-3 py-1 text-left transition-all hover:shadow-md ${b.color} ${b.kind === "available" ? "pointer-events-auto" : ""}`}
              style={{ top: `${top}px`, height: `${height}px`, zIndex: z, marginLeft: widthOffset }}
            >
              <div className="text-[11px] font-bold leading-tight truncate">{b.label}</div>
              <div className="text-[10px] opacity-70 leading-tight">
                {fmtTime(b.start)}–{fmtTime(b.end)}
                {b.sublabel ? ` · ${b.sublabel}` : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
