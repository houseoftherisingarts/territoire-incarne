import { useState } from "react";
import { Video, FileText, Loader2 } from "lucide-react";
import { useMeeting } from "../../hooks/useMeeting";
import { VideoCallRoom } from "../common/VideoCallRoom";

const fmtDate = (d: Date | null) => {
  if (!d) return "—";
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
};

const fmtTime = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
};

interface Props {
  clientUid: string;
}

export const ClientMeetingTab = ({ clientUid }: Props) => {
  const { meetings, loading, appendTranscript } = useMeeting(clientUid);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId);
  const available = meetings.filter((m) => m.status === "waiting" || m.status === "active");
  const past = meetings.filter((m) => m.status === "ended");

  if (activeMeeting) {
    return (
      <div className="space-y-4 animate-[fadeIn_0.4s_ease-out]">
        <div className="flex items-center justify-between">
          <p className="font-serif text-xl">{activeMeeting.title}</p>
          <button
            onClick={() => setActiveMeetingId(null)}
            className="font-sans text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          >
            ← Retour
          </button>
        </div>
        <VideoCallRoom
          roomUrl={activeMeeting.roomUrl}
          token={activeMeeting.clientToken}
          onTranscriptChunk={(chunk) => appendTranscript(activeMeeting.id, "client", chunk)}
          onEnd={() => setActiveMeetingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.6s_ease-out]">

      {/* Available meeting */}
      {available.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-rust">
            Réunion disponible
          </p>
          {available.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-5 border border-rust/30 dark:border-rust/20 rounded-2xl bg-rust/5 gap-4"
            >
              <div>
                <p className="font-serif text-lg">{m.title}</p>
                <p className="font-sans text-xs opacity-50 mt-0.5">
                  {fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setActiveMeetingId(m.id)}
                className="shrink-0 flex items-center gap-2 bg-rust text-paper px-5 py-2.5 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-ink transition-colors"
              >
                <Video size={13} /> Rejoindre
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && available.length === 0 && (
        <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-6 bg-white/20 dark:bg-white/5">
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-50 mb-2">Réunions vidéo</p>
          <p className="font-serif text-stone-500 dark:text-stone-400 italic text-sm leading-relaxed">
            Aucune réunion planifiée pour l'instant. Élise vous enverra une invitation lorsqu'une séance sera prête.
          </p>
        </div>
      )}

      {/* Past sessions with transcripts */}
      {past.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-sans uppercase tracking-[0.3em] opacity-50">
            Séances passées
          </p>
          {past.map((m) => {
            const hasTranscript = m.adminTranscript || m.clientTranscript;
            const merged = [
              m.adminTranscript ? `— Élise —\n${m.adminTranscript}` : "",
              m.clientTranscript ? `— Vous —\n${m.clientTranscript}` : "",
            ].filter(Boolean).join("\n\n");

            return (
              <div
                key={m.id}
                className="border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden bg-white/40 dark:bg-white/5"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <Video size={14} className="opacity-30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif">{m.title}</p>
                    <p className="font-sans text-xs opacity-40 mt-0.5">
                      {fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}
                      {m.endedAt && ` → ${fmtTime(m.endedAt)}`}
                    </p>
                  </div>
                </div>

                {/* Transcript status / content */}
                {m.transcriptStatus === "processing" && (
                  <div className="border-t border-stone-100 dark:border-stone-700 px-5 py-3 flex items-center gap-2 text-xs opacity-50 font-sans">
                    <Loader2 size={12} className="animate-spin" /> Transcription en cours…
                  </div>
                )}
                {hasTranscript && m.transcriptStatus !== "processing" && (
                  <div className="border-t border-stone-100 dark:border-stone-700 px-5 py-4 bg-stone-50/50 dark:bg-black/10">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={13} className="text-rust opacity-70" />
                      <p className="font-sans text-[10px] uppercase tracking-widest opacity-60">Transcription</p>
                    </div>
                    <p className="font-serif text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                      {merged}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
