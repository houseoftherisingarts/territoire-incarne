import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { Check } from "lucide-react";
import { db } from "../../firebase";
import { PartenaireVexelPanneau } from "../../vexel/PartenaireVexelPanneau";

// Onglet « Partenaire Vexel » de l'admin : pose le panneau du module portable
// (voir _vexel-base/src/vexel/README.md) avec le slug et la clé de ce site
// chez vexel-integrations, et écrit settings/vexel dans la base du site une
// fois le code reçu, pour que le badge du pied de page le lise.
const SLUG = "territoire-incarne";
const CLE = "Jq0wB2iOGqBWljdRZqWG9dFm";

export const PartenaireVexelSection = () => {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "settings/vexel"), (snap) => {
      setCode((snap.data()?.partenaire?.code as string | undefined) ?? null);
    });
  }, []);

  if (code) {
    return (
      <div className="max-w-2xl rounded-[15px] border border-ink/10 dark:border-white/10 bg-paper dark:bg-charcoal p-8">
        <div className="flex items-center gap-3 text-rust">
          <Check size={20} />
          <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold">Partenaire actif</p>
        </div>
        <p className="mt-4 font-serif text-lg">
          Le code <span className="font-semibold">{code}</span> est actif et le badge Vexel apparaît au pied du site.
        </p>
        <p className="mt-2 text-sm text-ink/60 dark:text-stone-100/60">
          Le partage, le palier et les versements se règlent dans l'espace partenaire, sur vexelwebstudio.com.
        </p>
      </div>
    );
  }

  return (
    <PartenaireVexelPanneau
      slug={SLUG}
      cle={CLE}
      onSucces={async (resultat) => {
        await setDoc(
          doc(db, "settings/vexel"),
          { partenaire: { code: resultat.code, signeLe: serverTimestamp() } },
          { merge: true },
        );
      }}
    />
  );
};
