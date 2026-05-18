import { useState } from "react";
import { Video, Plus, ChevronDown, ChevronUp, Pencil, Check, Loader2, AlertCircle } from "lucide-react";
import { useMeeting } from "../../hooks/useMeeting";
import { VideoCallRoom } from "../common/VideoCallRoom";
import { Card } from "./sections";

const DAILY_CONFIGURED = !!import.meta.env.VITE_DAILY_API_KEY;

const fmtDate = (d: Date | null) => {
  if (!d) return "—";
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (d: Date | null) => {
  if (!d) return "";
  return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
};

interface Props {
  clientUid: string;
}

export const MeetingTab = ({ clientUid }: Props) => {
  const { meetings, loading, create, start, end, appendTranscript, saveTranscript } = useMeeting(clientUid);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [editingTranscript, setEditingTranscript] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(false);
    const id = await create(title);
    await start(id);
    setTitle("");
    setActiveMeetingId(id);
  };

  const handleEnd = async () => {
    if (!activeMeetingId) return;
    await end(activeMeetingId);
    setActiveMeetingId(null);
  };

  const handleTranscriptChunk = (chunk: string) => {
    if (!activeMeetingId) return;
    appendTranscript(activeMeetingId, "admin", chunk);
  };

  const saveEdit = async (meetingId: string) => {
    await saveTranscript(meetingId, "admin", editText);
    setEditingTranscript(null);
  };

  const mergeTranscript = (admin: string, client: string) => {
    if (!admin && !client) return "";
    if (!client) return admin;
    if (!admin) return client;
    return `— Élise —\n${admin}\n\n— Cliente —\n${client}`;
  };

  if (!DAILY_CONFIGURED) {
    return (
      <Card className="p-8 text-center space-y-3">
        <Video size={28} className="mx-auto opacity-30" />
        <p className="font-serif italic text-stone-500 dark:text-stone-400">
          La visioconférence n'est pas encore configurée.
        </p>
        <p className="font-sans text-[11px] uppercase tracking-widest opacity-50">
          Contactez votre développeuse — il manque une clé technique pour activer cette fonction.
        </p>
      </Card>
    );
  }

  if (activeMeeting) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg">{activeMeeting.title}</p>
          <span className="text-[10px] font-sans uppercase tracking-widest text-emerald-600 font-bold animate-pulse">
            En cours
          </span>
        </div>

        <VideoCallRoom
          roomUrl={activeMeeting.roomUrl}
          token={activeMeeting.adminToken}
          onTranscriptChunk={handleTranscriptChunk}
          onEnd={handleEnd}
        />

        {activeMeeting.adminTranscript && (
          <Card className="p-4">
            <p className="text-[10px] font-sans uppercase tracking-widest opacity-50 mb-2">Transcription en cours</p>
            <p className="font-serif text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
              {activeMeeting.adminTranscript}
            </p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(!creating)}
          className="inline-flex items-center gap-2 bg-rust text-paper px-4 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
        >
          <Plus size={12} /> Nouvelle réunion
        </button>
      </div>

      {creating && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Séance du ${new Date().toLocaleDateString("fr-CA")}`}
              className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm outline-none focus:border-rust font-serif"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-rust text-paper px-5 py-2 rounded-sm uppercase tracking-[0.2em] text-[11px] font-bold font-sans hover:bg-ink transition-colors"
            >
              <Video size={12} /> Démarrer
            </button>
          </form>
        </Card>
      )}

      {loading && (
        <p className="font-sans text-sm opacity-50 py-10 text-center">Chargement…</p>
      )}

      {!loading && meetings.length === 0 && !creating && (
        <p className="font-serif italic text-stone-400 text-center py-10">
          Aucune réunion pour l'instant.
        </p>
      )}

      <div className="space-y-4">
        {meetings.map((m) => {
          const transcript = mergeTranscript(m.adminTranscript, m.clientTranscript);
          const expanded = expandedTranscript === m.id;
          const editing = editingTranscript === m.id;

          return (
            <Card key={m.id} className="overflow-hidden">
              {/* Meeting header */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Video size={14} className="shrink-0 opacity-40" />
                    <p className="font-serif text-base">{m.title}</p>
                  </div>
                  <p className="font-sans text-xs opacity-50 mt-0.5 ml-5">
                    {fmtDate(m.createdAt)} · {fmtTime(m.createdAt)}
                    {m.endedAt && ` → ${fmtTime(m.endedAt)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.status === "waiting" && (
                    <button
                      onClick={async () => { await start(m.id); setActiveMeetingId(m.id); }}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-sans uppercase tracking-widest font-bold hover:bg-emerald-700 transition-colors"
                    >
                      <Video size={11} /> Rejoindre
                    </button>
                  )}
                  {m.status === "active" && (
                    <button
                      onClick={() => setActiveMeetingId(m.id)}
                      className="inline-flex items-center gap-1.5 bg-rust text-white px-3 py-1.5 rounded-xl text-[10px] font-sans uppercase tracking-widest font-bold hover:bg-red-700 transition-colors animate-pulse"
                    >
                      <Video size={11} /> En cours
                    </button>
                  )}
                  {m.status === "ended" && m.transcriptStatus === "processing" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest opacity-50">
                      <Loader2 size={11} className="animate-spin" /> Transcription…
                    </span>
                  )}
                  {m.status === "ended" && m.transcriptStatus === "error" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest text-red-400">
                      <AlertCircle size={11} /> Erreur
                    </span>
                  )}
                  {m.status === "ended" && (m.transcriptStatus === "done" || m.adminTranscript) && (
                    <button
                      onClick={() => setExpandedTranscript(expanded ? null : m.id)}
                      className="inline-flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl text-[10px] font-sans uppercase tracking-widest hover:border-rust hover:text-rust transition-colors"
                    >
                      {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      Transcription
                    </button>
                  )}
                </div>
              </div>

              {/* Transcript — always open for ended meetings with content, collapsible */}
              {m.status === "ended" && (expanded || !transcript) && (
                <div className="border-t border-ink/5 dark:border-white/5 bg-stone-50/60 dark:bg-black/10 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-sans text-[10px] uppercase tracking-widest opacity-50">Transcription</p>
                    {!editing && (
                      <button
                        onClick={() => { setEditingTranscript(m.id); setEditText(m.adminTranscript); }}
                        className="inline-flex items-center gap-1 text-[10px] font-sans uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-rust transition-all"
                      >
                        <Pencil size={10} /> Modifier
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={8}
                        className="w-full bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-sm px-3 py-2 text-sm font-serif outline-none focus:border-rust resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(m.id)}
                          className="inline-flex items-center gap-1.5 bg-rust text-paper px-4 py-2 rounded-sm text-[10px] font-sans uppercase tracking-widest font-bold hover:bg-ink transition-colors"
                        >
                          <Check size={11} /> Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingTranscript(null)}
                          className="px-4 py-2 border border-ink/10 dark:border-white/10 rounded-sm text-[10px] font-sans uppercase tracking-widest hover:border-rust hover:text-rust transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-sm italic opacity-40">
                      Aucune transcription pour cette séance.
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
