import { useMemo, useRef, useEffect } from "react";
import {
  combineMontrealDateTime,
  dayOfWeekMontreal,
  fmtTime,
  halfHourSlots,
  isoDate,
  addDays,
  montrealHM,
} from "../../lib/datetime";
import {
  BLOCK_COLORS, colorForAppointment, colorForAvailability,
  type Appointment, type AvailabilitySlot, type PersonalEvent,
} from "../../types/calendar";
import type { GridBlock } from "./DayGrid";

interface Props {
  weekStart: Date; // any moment on Sunday of the week
  startHour?: number;
  endHour?: number;
  appointments?: Appointment[];
  personalEvents?: PersonalEvent[];
  availability?: AvailabilitySlot[];
  onSlotClick?: (start: Date) => void;
  onBlockClick?: (block: GridBlock) => void;
  onDayHeaderClick?: (date: Date) => void;
}

const SLOT_HEIGHT_PX = 28;
const TIME_COL_WIDTH_PX = 56;
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export const WeekGrid = ({
  weekStart,
  startHour = 8,
  endHour = 21,
  appointments = [],
  personalEvents = [],
  availability = [],
  onSlotClick,
  onBlockClick,
  onDayHeaderClick,
}: Props) => {
  const slots = useMemo(
    () => halfHourSlots().filter((t) => {
      const [h] = t.split(":").map(Number);
      return h >= startHour && h < endHour;
    }),
    [startHour, endHour],
  );

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) arr.push(addDays(weekStart, i));
    return arr;
  }, [weekStart]);

  const blocksPerDay = useMemo<Record<string, GridBlock[]>>(() => {
    const out: Record<string, GridBlock[]> = {};
    for (const d of days) out[isoDate(d)] = [];

    // Availability blocks
    for (const a of availability) {
      if (!a.active) continue;
      for (const d of days) {
        const dKey = isoDate(d);
        const dow = dayOfWeekMontreal(d);
        const matches = a.recurring ? a.dayOfWeek === dow : a.date === dKey;
        if (!matches) continue;
        out[dKey].push({
          id: `avail-${a.id}-${dKey}`,
          kind: "available",
          start: combineMontrealDateTime(dKey, a.startTime),
          end: combineMontrealDateTime(dKey, a.endTime),
          label: a.category === "danse" ? "Danse" : "Disponible",
          color: colorForAvailability(a),
          data: a,
        });
      }
    }
    // Appointments
    for (const ap of appointments) {
      const start = ap.start.toDate();
      const dKey = isoDate(start);
      if (!(dKey in out)) continue;
      out[dKey].push({
        id: `appt-${ap.id}`,
        kind: "appointment",
        start,
        end: ap.end.toDate(),
        label: ap.clientName || ap.clientEmail || "RDV",
        sublabel: ap.type,
        color: colorForAppointment(ap.status),
        data: ap,
      });
    }
    // Personal
    for (const ev of personalEvents) {
      const start = ev.start.toDate();
      const dKey = isoDate(start);
      if (!(dKey in out)) continue;
      out[dKey].push({
        id: `personal-${ev.id}`,
        kind: "personal",
        start,
        end: ev.end.toDate(),
        label: ev.title,
        color: BLOCK_COLORS.personal,
        data: ev,
      });
    }
    return out;
  }, [days, appointments, personalEvents, availability]);

  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.scrollTop = (9 - startHour) * 2 * SLOT_HEIGHT_PX;
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

  const todayIso = isoDate(new Date());

  return (
    <div className="border border-stone-200 dark:border-white/10 rounded-2xl bg-paper dark:bg-stone-900/40 overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-stone-200 dark:border-white/10 sticky top-0 bg-paper/95 dark:bg-stone-900/95 backdrop-blur-sm z-10">
        <div style={{ width: `${TIME_COL_WIDTH_PX}px` }} className="shrink-0" />
        {days.map((d) => {
          const isToday = isoDate(d) === todayIso;
          return (
            <button
              key={isoDate(d)}
              onClick={() => onDayHeaderClick?.(d)}
              className={`flex-1 px-2 py-2 text-center hover:bg-stone-100 dark:hover:bg-white/5 transition-colors border-l border-stone-200/50 dark:border-white/5 ${isToday ? "bg-rust/5 dark:bg-rust/10" : ""}`}
            >
              <div className="text-[10px] font-sans uppercase tracking-widest opacity-60">
                {DAY_LABELS[dayOfWeekMontreal(d)]}
              </div>
              <div className={`font-serif text-lg ${isToday ? "text-rust font-bold" : ""}`}>
                {d.getUTCDate() /* good enough for label */}
              </div>
            </button>
          );
        })}
      </div>

      {/* Grid body */}
      <div ref={gridRef} className="overflow-y-auto max-h-[65vh]">
        <div className="relative flex" style={{ height: `${slots.length * SLOT_HEIGHT_PX}px` }}>
          {/* Time column */}
          <div className="shrink-0 border-r border-stone-200 dark:border-white/10" style={{ width: `${TIME_COL_WIDTH_PX}px` }}>
            {slots.map((t, i) => {
              const isHour = t.endsWith(":00");
              return (
                <div
                  key={t}
                  className={`px-2 text-[10px] font-mono ${isHour ? "opacity-70 border-t border-stone-300 dark:border-white/15" : "opacity-30 border-t border-stone-200/50 dark:border-white/5"}`}
                  style={{ height: `${SLOT_HEIGHT_PX}px` }}
                >
                  {isHour ? t : ""}
                  <span className="sr-only">{i}</span>
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dKey = isoDate(d);
            const dayBlocks = blocksPerDay[dKey] ?? [];
            return (
              <div key={dKey} className="flex-1 relative border-l border-stone-200/50 dark:border-white/5">
                {/* Background hour rows */}
                {slots.map((t, i) => {
                  const isHour = t.endsWith(":00");
                  const slotStart = combineMontrealDateTime(dKey, t);
                  return (
                    <button
                      key={t}
                      onClick={() => onSlotClick?.(slotStart)}
                      className={`absolute left-0 right-0 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors ${isHour ? "border-t border-stone-300 dark:border-white/15" : "border-t border-stone-200/50 dark:border-white/5"}`}
                      style={{ top: `${i * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
                      aria-label={`${dKey} ${t}`}
                    />
                  );
                })}

                {/* Blocks */}
                {dayBlocks.map((b) => {
                  const { top, height } = positionFor(b);
                  const z = b.kind === "available" ? 1 : 5;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onBlockClick?.(b)}
                      className={`absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 text-left text-[10px] transition-all hover:shadow-md overflow-hidden ${b.color}`}
                      style={{ top: `${top}px`, height: `${height}px`, zIndex: z }}
                    >
                      <div className="font-bold leading-tight truncate">{b.label}</div>
                      <div className="opacity-70 leading-tight truncate">
                        {fmtTime(b.start)}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
