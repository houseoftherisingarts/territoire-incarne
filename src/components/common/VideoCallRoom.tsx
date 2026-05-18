import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, FileText } from "lucide-react";

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSR = (): (new () => SpeechRec) | null =>
  typeof window !== "undefined"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
    : null;

interface Props {
  roomUrl: string;
  token: string;
  onTranscriptChunk: (chunk: string) => void;
  onEnd: () => void;
}

export const VideoCallRoom = ({ roomUrl, token, onTranscriptChunk, onEnd }: Props) => {
  const [transcribing, setTranscribing] = useState(false);
  const [liveText, setLiveText] = useState("");
  const recognitionRef = useRef<SpeechRec | null>(null);
  const SR = getSR();

  const startTranscription = () => {
    if (!SR) return;
    const r = new SR();
    r.lang = "fr-CA";
    r.continuous = true;
    r.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript as string;
        if (e.results[i].isFinal) {
          onTranscriptChunk(t.trim());
        } else {
          interim += t;
        }
      }
      setLiveText(interim);
    };
    r.onend = () => {
      if (transcribing) r.start();
    };
    r.start();
    recognitionRef.current = r;
    setTranscribing(true);
  };

  const stopTranscription = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setTranscribing(false);
    setLiveText("");
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const embedUrl = `${roomUrl}?t=${token}&showLeaveButton=false&showFullscreenButton=true`;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        allow="microphone; camera; fullscreen; display-capture; autoplay"
        className="w-full"
        style={{ height: "65vh", border: "none" }}
        title="Réunion vidéo"
      />

      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-2">
        {liveText && (
          <div className="flex-1 bg-black/70 text-white text-sm font-serif italic px-4 py-2 rounded-xl backdrop-blur-sm">
            <FileText size={12} className="inline mr-1.5 opacity-60" />
            {liveText}
          </div>
        )}

        <div className="flex gap-2 shrink-0 ml-auto">
          {SR && (
            <button
              onClick={transcribing ? stopTranscription : startTranscription}
              title={transcribing ? "Arrêter la transcription" : "Démarrer la transcription"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-sans uppercase tracking-widest font-bold backdrop-blur-sm transition-colors ${
                transcribing
                  ? "bg-rust text-white hover:bg-red-700"
                  : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              {transcribing ? <Mic size={13} /> : <MicOff size={13} />}
              {transcribing ? "Transcription active" : "Transcrire"}
            </button>
          )}

          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-[10px] font-sans uppercase tracking-widest font-bold hover:bg-red-700 transition-colors backdrop-blur-sm"
          >
            <X size={13} /> Terminer
          </button>
        </div>
      </div>
    </div>
  );
};
