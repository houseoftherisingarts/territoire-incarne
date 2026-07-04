import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { Content } from "../i18n";

export const Connecter = ({ content }: { content: Content["sections"]["connecter"] }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      await addDoc(collection(db, "leads"), {
        email: email.trim().toLowerCase(),
        source: "connecter",
        tier: "warm",
        createdAt: serverTimestamp(),
      });
      setStatus("sent");
      setEmail("");
    } catch (err) {
      console.error("Lead submission failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="mt-8 space-y-12 animate-[fadeIn_1s_ease-out] flex flex-col items-center relative z-10">
      <form className="space-y-8 w-full" onSubmit={submit}>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            disabled={status === "sending" || status === "sent"}
            className="peer w-full bg-transparent border-b border-stone-400 dark:border-stone-500 py-4 text-xl outline-none focus:border-rust dark:focus:border-white transition-colors text-ink dark:text-stone-100 disabled:opacity-50"
            required
          />
          <label className="absolute left-0 top-4 text-stone-400 dark:text-stone-400 transition-all duration-300 peer-focus:-top-6 peer-focus:text-xs peer-focus:text-rust dark:peer-focus:text-white peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs">
            {content.placeholder}
          </label>
        </div>
        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="text-sm font-sans tracking-[0.3em] uppercase hover:text-rust dark:hover:text-white transition-colors border-b border-transparent hover:border-rust dark:hover:border-white pb-1 text-ink dark:text-stone-200 w-full text-left disabled:opacity-50"
        >
          {status === "sending" ? "Envoi…" : status === "sent" ? "✓ Reçu, merci" : content.btn}
        </button>
        {status === "error" && (
          <p className="font-sans text-xs text-rust">Un problème est survenu. Réessayez svp.</p>
        )}
      </form>
    </div>
  );
};
