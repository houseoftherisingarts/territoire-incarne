import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Clock, Mail, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { useFirestoreCollection } from "../../../hooks/useFirestoreCollection";
import { DayGrid, type GridBlock } from "../../calendar/DayGrid";
import { WeekGrid } from "../../calendar/WeekGrid";
import { MonthGrid } from "../../calendar/MonthGrid";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { ManualBookingModal } from "./ManualBookingModal";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { fmtDateLong, fmtDateShort, isoDate, addDays, fmtTime, dayOfWeekMontreal } from "../../../lib/datetime";
import { buildIcs, downloadIcs } from "../../../lib/ical";
import type { Appointment, AvailabilitySlot, PersonalEvent } from "../../../types/calendar";
import { Card } from "../sections";

type Tab = "agenda" | "availability" | "requests";
type CalView = "day" | "week" | "month";

const MONTH_LONG = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "America/Montreal",
  month: "long",
  year: "numeric",
});

export const AdminCalendarSection = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalView>("week");
  const [tab, setTab] = useState<Tab>("agenda");
  const [creating, setCreating] = useState(false);
  const [seedTime, setSeedTime] = useState<string | undefined>(undefined);
  const [openAppt, setOpenAppt] = useState<Appointment | null>(null);

  const { items: appointments, error: appointmentsErr } = useFirestoreCollection<Appointment>("appointments", {
    orderField: "start",
    orderDirection: "asc",
  });
  const { items: availability, error: availabilityErr } = useFirestoreCollection<AvailabilitySlot>("availability");
  const { items: personalEvents, error: personalErr } = useFirestoreCollection<PersonalEvent>("personalEvents", {
    orderField: "start",
    orderDirection: "asc",
  });

  const requestsCount = useMemo(
    () => appointments.filter((a) => a.status === "requested").length,
    [appointments],
  );

  // First-mount: if there are pending requests when she opens the page, jump to Demandes.
  const seededTab = useMemo(() => requestsCount > 0 ? "requests" : "agenda" as Tab, []);
  // Apply only on initial mount, not on later changes.
  useEffect(() => {
    if (seededTab === "requests") setTab("requests");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstError = appointmentsErr ?? availabilityErr ?? personalErr;

  // Keep the technical detail in the console for the dev; the UI stays user-facing.
  useEffect(() => {
    if (firstError) console.error("Calendar load error:", firstError);
  }, [firstError]);

  // Compute the start of the week containing `date` (Sunday)
  const weekStart = useMemo(() => addDays(date, -dayOfWeekMontreal(date)), [date]);

  const exportIcal = () => {
    const events = [
      ...appointments.filter((a) => a.status !== "cancelled").map((a) => ({
        uid: `appt-${a.id}`,
        start: a.start.toDate(),
        end: a.end.toDate(),
        summary: `${a.clientName || a.clientEmail} — ${a.type ?? "RDV"}`,
        description: a.notes ?? "",
        url: a.meetingUrl,
      })),
      ...personalEvents.map((e) => ({
        uid: `personal-${e.id}`,
        start: e.start.toDate(),
        end: e.end.toDate(),
        summary: e.title,
        description: e.notes ?? "",
      })),
    ];
    downloadIcs(`calendrier-${isoDate(new Date())}.ics`, buildIcs(events, "Territoire Incarné — Elise"));
  };

  const onSlotClick = (start: Date) => {
    setSeedTime(fmtTime(start));
    setDate(start);
    setCreating(true);
  };

  const onBlockClick = (b: GridBlock) => {
    if (b.kind === "appointment" && b.data) setOpenAppt(b.data as Appointment);
  };

  const goPrev = () => {
    if (view === "day") setDate(addDays(date, -1));
    else if (view === "week") setDate(addDays(date, -7));
    else {
      const d = new Date(date);
      d.setUTCMonth(d.getUTCMonth() - 1);
      setDate(d);
    }
  };
  const goNext = () => {
    if (view === "day") setDate(addDays(date, 1));
    else if (view === "week") setDate(addDays(date, 7));
    else {
      const d = new Date(date);
      d.setUTCMonth(d.getUTCMonth() + 1);
      setDate(d);
    }
  };

  const headerLabel = view === "month"
    ? MONTH_LONG.format(date)
    : view === "week"
      ? `${fmtDateShort(weekStart)} – ${fmtDateShort(addDays(weekStart, 6))}`
      : fmtDateLong(date);

  return (
    <div className="space-y-6">
      {creating && (
        <ManualBookingModal initialDate={date} initialStart={seedTime} onClose={() => setCreating(false)} />
      )}
      {openAppt && (
        <AppointmentDetailModal appointment={openAppt} onClose={() => setOpenAppt(null)} />
      )}

      {firstError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-700 dark:text-red-300 mb-1">
              Le calendrier n'arrive pas à charger.
            </p>
            <p className="font-serif italic text-xs opacity-70 mt-1">
              Réessayez dans un instant. Si le calendrier ne revient pas, écrivez à votre équipe technique.
            </p>
          </div>
        </div>
      )}

      {requestsCount > 0 && tab !== "requests" && (
        <button
          onClick={() => setTab("requests")}
          className="w-full bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-amber-200/60 dark:hover:bg-amber-900/30 transition-colors"
        >
          <Mail size={16} className="text-amber-700 dark:text-amber-300 shrink-0" />
          <span className="flex-1 font-serif">
            <strong>{requestsCount}</strong> nouvelle{requestsCount > 1 ? "s" : ""} demande{requestsCount > 1 ? "s" : ""} de RDV en attente
          </span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-800 dark:text-amber-200">
            Voir →
          </span>
        </button>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={goPrev} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust">
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={isoDate(date)}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-").map(Number);
              setDate(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
            }}
            className="bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-1.5 text-sm font-mono outline-none focus:border-rust"
          />
          <button onClick={goNext} className="p-2 rounded-full hover:bg-rust/15 hover:text-rust">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setDate(new Date())} className="ml-2 text-[10px] font-sans uppercase tracking-widest opacity-60 hover:opacity-100">
            Aujourd'hui
          </button>
          <span className="ml-3 hidden md:inline font-serif italic text-stone-500">{headerLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-ink/5 dark:bg-white/10 rounded-full p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-colors ${view === v ? "bg-rust text-paper" : "opacity-60 hover:opacity-100"}`}
              >
                {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
              </button>
            ))}
          </div>
          <button onClick={exportIcal} title="Pour Apple Calendrier, Google Agenda, Outlook" className="inline-flex items-center gap-2 border border-ink/10 dark:border-white/10 px-3 py-2 rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold font-sans hover:border-rust hover:text-rust transition-colors">
            <Download size={11} /> Exporter mon agenda
          </button>
          <button onClick={() => { setSeedTime(undefined); setCreating(true); }} className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors">
            <Plus size={12} /> Nouveau
          </button>
        </div>
      </div>

      <div className="flex border-b border-ink/10 dark:border-white/10 -mb-px">
        {([
          { id: "agenda", label: "Agenda", Icon: CalendarIcon, badge: 0 },
          { id: "availability", label: "Heures d'ouverture", Icon: Clock, badge: 0 },
          { id: "requests", label: "RDV en attente", Icon: Mail, badge: requestsCount },
        ] as const).map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`px-5 py-2 text-xs font-sans uppercase tracking-widest transition-colors flex items-center gap-2 ${tab === id ? "text-rust border-b-2 border-rust -mb-px" : "opacity-60 hover:opacity-100"}`}
          >
            <Icon size={12} /> {label}
            {badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold leading-none animate-pulse">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "agenda" && view === "day" && (
        <DayGrid
          date={date}
          appointments={appointments}
          personalEvents={personalEvents}
          availability={availability}
          showAvailability
          onSlotClick={(start) => onSlotClick(start)}
          onBlockClick={onBlockClick}
        />
      )}

      {tab === "agenda" && view === "week" && (
        <WeekGrid
          weekStart={weekStart}
          appointments={appointments}
          personalEvents={personalEvents}
          availability={availability}
          onSlotClick={onSlotClick}
          onBlockClick={onBlockClick}
          onDayHeaderClick={(d) => { setDate(d); setView("day"); }}
        />
      )}

      {tab === "agenda" && view === "month" && (
        <MonthGrid
          monthAnchor={date}
          appointments={appointments}
          personalEvents={personalEvents}
          availability={availability}
          onDayClick={(d) => { setDate(d); setView("day"); }}
        />
      )}

      {tab === "availability" && <AvailabilityEditor />}

      {tab === "requests" && (
        <RequestsList appointments={appointments.filter((a) => a.status === "requested")} onOpen={setOpenAppt} />
      )}
    </div>
  );
};

const RequestsList = ({ appointments, onOpen }: { appointments: Appointment[]; onOpen: (a: Appointment) => void }) => {
  if (appointments.length === 0) {
    return <Card className="p-10 text-center italic opacity-60 font-serif">Aucune demande en attente.</Card>;
  }
  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <button
          key={a.id}
          onClick={() => onOpen(a)}
          className="w-full text-left bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-5 hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-serif text-lg">{a.clientName || a.clientEmail}</p>
              <p className="text-xs opacity-60 font-mono">{a.clientEmail}</p>
              <p className="text-sm mt-1">
                {fmtDateShort(a.start.toDate())} · {fmtTime(a.start.toDate())} – {fmtTime(a.end.toDate())} · {a.durationMin} min
              </p>
              {a.notes && <p className="text-sm font-serif italic opacity-70 mt-1">{a.notes}</p>}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200">
              En attente
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
