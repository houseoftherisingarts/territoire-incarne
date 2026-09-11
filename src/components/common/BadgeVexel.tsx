import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const VEXEL_URL = "https://vexelwebstudio.com/";

/** Le collant « Site créé par Vexel Webstudio » du pied de page. Un clic ouvre une petite
 *  carte qui dit qui a bâti le site et mène à vexelwebstudio.com. Territoire Incarné n'est
 *  pas dans le programme partenaire de Vexel : aucun rabais ni commission n'est promis ici. */
export const BadgeVexel = () => {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Site créé par Vexel Webstudio : en savoir plus"
        className="fixed bottom-5 right-5 z-[110] flex items-center gap-2.5 rounded-full border border-ink/10 dark:border-white/15 bg-paper/90 dark:bg-charcoal/90 pl-2 pr-4 py-2 shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <img src="/vexel-logo.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain rounded-full" />
        <span className="text-left leading-tight">
          <span className="block text-[9px] font-sans uppercase tracking-[0.2em] opacity-50">Site créé par</span>
          <span className="block font-serif text-sm text-ink dark:text-stone-100">Vexel Webstudio</span>
        </span>
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-[700] bg-ink/70 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOuvert(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Un site bâti pour durer"
        >
          <div className="w-full max-w-md bg-paper dark:bg-charcoal rounded-2xl overflow-hidden shadow-2xl p-8">
            <div className="flex items-start justify-between gap-4">
              <img src="/vexel-logo.png" alt="Vexel Webstudio" className="h-14 w-14 object-contain rounded-full" />
              <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-stone-500 hover:text-ink dark:hover:text-white shrink-0">
                <X size={20} />
              </button>
            </div>
            <h3 className="font-serif text-2xl mt-4">Un site bâti pour durer</h3>
            <p className="font-serif text-sm opacity-70 leading-relaxed mt-3">
              Ce site a été conçu et bâti par Vexel Webstudio, un studio du Québec qui fait des sites sur
              mesure : le design, le code, l'espace client et l'administration que vous voyez ici.
            </p>
            <a
              href={VEXEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-ink dark:bg-stone-100 text-paper dark:text-forest font-sans text-xs font-bold uppercase tracking-[0.2em] min-h-[44px] px-6 rounded-full hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
            >
              Visiter Vexel Webstudio <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )}
    </>
  );
};
