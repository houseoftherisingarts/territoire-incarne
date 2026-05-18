import { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { Send, Music } from "lucide-react";
import { db } from "../../firebase";
import { startCheckout } from "../../hooks/useCheckout";

interface MyClassRow {
  classId: string;
  status: "pending" | "approved" | "paid" | "rejected";
  title: string;
  priceCents: number;
}

interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt?: { toDate: () => Date };
}

const fmtTime = (d?: Date | null) => {
  if (!d) return "";
  return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
};

const useMyRequests = (uid: string) => {
  const [rows, setRows] = useState<MyClassRow[]>([]);
  useEffect(() => {
    // Scan classes (small N) and read each request doc by uid.
    return onSnapshot(collection(db, "classes"), async (snap) => {
      const all: MyClassRow[] = [];
      await Promise.all(
        snap.docs.map(async (d) => {
          const reqSnap = await getDoc(doc(db, `classes/${d.id}/requests/${uid}`));
          if (reqSnap.exists()) {
            const r = reqSnap.data();
            all.push({
              classId: d.id,
              status: (r.status as MyClassRow["status"]) ?? "pending",
              title: d.data().title ?? "",
              priceCents: d.data().priceCents ?? 0,
            });
          }
        }),
      );
      setRows(all);
    });
  }, [uid]);
  return rows;
};

const ClassChatroom = ({ classId, uid, displayName }: { classId: string; uid: string; displayName: string }) => {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, `classes/${classId}/messages`), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
  }, [classId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, `classes/${classId}/messages`), {
      uid,
      displayName,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div className="border-t border-stone-200 dark:border-stone-700 pt-4 mt-4">
      <p className="text-[10px] font-sans uppercase tracking-[0.25em] opacity-60 mb-3">
        <Music size={11} className="inline mr-1" /> Chatroom du groupe
      </p>
      <div className="bg-white/40 dark:bg-black/20 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-2 mb-3">
        {msgs.length === 0 ? (
          <p className="text-xs italic opacity-50 text-center py-4">Aucun message — soyez la première.</p>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className={`text-sm ${m.uid === uid ? "text-right" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest opacity-50 mb-0.5">
                {m.displayName} · {fmtTime(m.createdAt?.toDate())}
              </div>
              <div className={`inline-block px-3 py-1.5 rounded-2xl ${m.uid === uid ? "bg-rust text-paper" : "bg-stone-200 dark:bg-stone-700"}`}>
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 bg-paper dark:bg-black/30 border border-ink/10 dark:border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-rust"
        />
        <button type="submit" className="px-4 py-2 bg-ink text-paper dark:bg-stone-100 dark:text-forest rounded-full text-xs uppercase tracking-widest hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export const ClientClassesTab = ({ uid, displayName }: { uid: string; displayName: string }) => {
  const rows = useMyRequests(uid);
  const [paying, setPaying] = useState<string | null>(null);

  const pay = async (row: MyClassRow) => {
    setPaying(row.classId);
    try {
      await startCheckout({
        purpose: "class",
        metadata: { classId: row.classId, displayName },
        lineItems: [
          {
            name: row.title,
            amount: row.priceCents,
            quantity: 1,
          },
        ],
        successPath: "/client?paid=1",
        cancelPath: "/client",
      });
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Le paiement n'est pas encore configuré.");
      setPaying(null);
    }
  };

  if (rows.length === 0) {
    return (
      <p className="font-serif italic opacity-60 py-10 text-center">
        Vous n'avez pas encore demandé à rejoindre un cours.
      </p>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
      {rows.map((row) => (
        <div key={row.classId} className="border border-stone-200 dark:border-stone-700 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-serif text-xl">{row.title}</p>
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full mt-1 inline-block ${
                row.status === "paid" ? "bg-forest/15 text-forest dark:bg-forest/30 dark:text-stone-100" :
                row.status === "approved" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                row.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
              }`}>
                {row.status === "pending" ? "En attente d'approbation" :
                 row.status === "approved" ? "Approuvé · paiement requis" :
                 row.status === "paid" ? "Membre actif" : "Refusé"}
              </span>
            </div>
            {row.status === "approved" && row.priceCents > 0 && (
              <button
                onClick={() => pay(row)}
                disabled={paying === row.classId}
                className="px-5 py-2 bg-rust text-paper rounded-full text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50"
              >
                {paying === row.classId ? "…" : `Payer ${(row.priceCents / 100).toFixed(2)}$`}
              </button>
            )}
          </div>
          {row.status === "paid" && <ClassChatroom classId={row.classId} uid={uid} displayName={displayName} />}
        </div>
      ))}
    </div>
  );
};
