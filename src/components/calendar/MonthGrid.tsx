import { useMemo } from "react";
import { dayOfWeekMontreal, fmtTime, isoDate, addDays } from "../../lib/datetime";
import type { Appointment, AvailabilitySlot, PersonalEvent } from "../../types/calendar";

// MonthGrid uses simpler "chip" colors — keep them aligned with day/week views
// but slightly lighter since they're tiny.
const CHIP = {
  availabilityConsultation: "bg-rose-200/70 text-rose-900 dark:bg-rose-300/30 dark:text-rose-100",
  availabilityDanse:        "bg-orange-200/70 text-orange-900 dark:bg-orange-300/30 dark:text-orange-100",
  appointmentConfirmed:     "bg-rust/15 text-ink dark:bg-rust/30 dark:text-stone-100",
  appointmentRequested:     "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  appointmentCancelled:     "bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400 line-through opacity-60",
  personal:                 "bg-sky-200/70 text-sky-900 dark:bg-sky-300/30 dark:text-sky-100 italic",
};

interface Props {
  monthAnchor: Date; // any moment in the target month
  appointments?: Appointment[];
  personalEvents?: PersonalEvent[];
  availability?: AvailabilitySlot[];
  onDayClick?: (date: Date) => void;
}

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

interface CellEntry {
  id: string;
  kind: "appointment" | "personal" | "available";
  label: string;
  time: string;
  color: string;
}

export const MonthGrid = ({
  monthAnchor,
  appointments = [],
  personalEvents = [],
  availability = [],
  onDayClick,
}: Props) => {
  // Compute the 6×7 grid starting from Sunday on/before the 1st of the month
  const grid = useMemo(() => {
    const monthStartIso = `${isoDate(monthAnchor).slice(0, 7)}-01`;
    const [y, m] = monthStartIso.split("-").map(Number);
    const firstOfMonth = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
    const firstDow = dayOfWeekMontreal(firstOfMonth);
    const gridStart = addDays(firstOfMonth, -firstDow);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    return { days, monthIndex: m - 1 };
  }, [monthAnchor]);

  // Bucket entries per day-iso
  const entriesByDay = useMemo<Record<string, CellEntry[]>>(() => {
    const out: Record<string, CellEntry[]> = {};
    for (const d of grid.days) out[isoDate(d)] = [];

    for (const a of availability) {
      if (!a.active) continue;
      for (const d of grid.days) {
        const dKey = isoDate(d);
        const matches = a.recurring ? a.dayOfWeek === dayOfWeekMontreal(d) : a.date === dKey;
        if (matches) {
          out[dKey].push({
            id: `avail-${a.id}-${dKey}`,
            kind: "available",
            label: `${a.startTime}–${a.endTime}`,
            time: a.startTime,
            color: a.category === "danse" ? CHIP.availabilityDanse : CHIP.availabilityConsultation,
          });
        }
      }
    }
    for (const ap of appointments) {
      const dKey = isoDate(ap.start.toDate());
      if (!(dKey in out)) continue;
      out[dKey].push({
        id: `appt-${ap.id}`,
        kind: "appointment",
        label: ap.clientName || ap.clientEmail || "RDV",
        time: fmtTime(ap.start.toDate()),
        color: ap.status === "cancelled" ? CHIP.appointmentCancelled
             : ap.status === "requested" ? CHIP.appointmentRequested
             : CHIP.appointmentConfirmed,
      });
    }
    for (const ev of personalEvents) {
      const dKey = isoDate(ev.start.toDate());
      if (!(dKey in out)) continue;
      out[dKey].push({
        id: `personal-${ev.id}`,
        kind: "personal",
        label: ev.title,
        time: fmtTime(ev.start.toDate()),
        color: CHIP.personal,
      });
    }
    // Sort each day's entries by time
    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => a.time.localeCompare(b.time));
    }
    return out;
  }, [grid.days, appointments, personalEvents, availability]);

  const todayIso = isoDate(new Date());

  return (
    <div className="border border-stone-200 dark:border-white/10 rounded-2xl bg-paper dark:bg-stone-900/40 overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-stone-200 dark:border-white/10 bg-paper/95 dark:bg-stone-900/95">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center py-2 text-[10px] font-sans uppercase tracking-widest opacity-60 border-l first:border-l-0 border-stone-200/50 dark:border-white/5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.days.map((d) => {
          const dKey = isoDate(d);
          const entries = entriesByDay[dKey] ?? [];
          const dayNum = parseInt(dKey.slice(8, 10), 10);
          const monthOfThis = parseInt(dKey.slice(5, 7), 10) - 1;
          const inMonth = monthOfThis === grid.monthIndex;
          const isToday = dKey === todayIso;
          const visible = entries.slice(0, 3);
          const overflow = entries.length - visible.length;
          return (
            <button
              key={dKey}
              onClick={() => onDayClick?.(d)}
              className={`min-h-[100px] p-1.5 text-left border-l border-t border-stone-200/50 dark:border-white/5 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors ${inMonth ? "" : "opacity-40"} ${isToday ? "bg-rust/5 dark:bg-rust/10 ring-1 ring-inset ring-rust/30" : ""}`}
            >
              <div className={`text-xs font-mono mb-1 ${isToday ? "text-rust font-bold" : "opacity-70"}`}>
                {dayNum}
              </div>
              <div className="space-y-0.5">
                {visible.map((e) => (
                  <div
                    key={e.id}
                    className={`px-1.5 py-0.5 rounded text-[10px] leading-tight truncate ${e.color}`}
                  >
                    {e.kind !== "available" && <span className="font-mono mr-1 opacity-70">{e.time}</span>}
                    {e.label}
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="px-1.5 text-[10px] opacity-60">+{overflow} de plus</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
