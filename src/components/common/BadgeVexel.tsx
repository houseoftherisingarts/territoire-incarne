import { useCallback, useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const VEXEL_URL = "https://vexelwebstudio.com/compte";
const SALON_URL = "https://lesalondesinconnus.com/";

/** Le reflet holographique suit le pointeur (--mx, --my) et incline le collant (--rx, --ry).
 *  Porté de xena-horizon-platform (components/BadgeVexel.tsx, hook useFoil). */
function useFoil() {
  const ref = useRef<HTMLButtonElement>(null);
  const suivre = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
  }, []);
  const relacher = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "30%");
    el.style.setProperty("--my", "30%");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);
  return { ref, suivre, relacher };
}

/** Le collant foil « Site créé par Vexel Webstudio » du pied de page : liseré blanc découpé,
 *  reflet holographique irisé (visible même au repos), léger basculement 3D au pointeur, posé
 *  bien droit dans le pied de page (jamais flottant). Un clic ouvre une carte, dans les couleurs
 *  de Territoire Incarné, qui dit qui a bâti le site et mène à vexelwebstudio.com. */
export const BadgeVexel = ({ className = "" }: { className?: string }) => {
  const [ouvert, setOuvert] = useState(false);
  const foil = useFoil();

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert]);

  return (
    <>
      <button
        ref={foil.ref}
        type="button"
        onClick={() => setOuvert(true)}
        onPointerMove={foil.suivre}
        onPointerLeave={foil.relacher}
        aria-label="Site créé par Vexel Webstudio : en savoir plus"
        className={`vx-foil relative inline-flex select-none items-center gap-3 rounded-[15px] px-4 py-3 ${className}`}
      >
        <span aria-hidden className="vx-foil-sheen" />
        <span aria-hidden className="vx-foil-grain" />
        <img
          src="/vexel-logo.png"
          alt=""
          aria-hidden="true"
          width={329}
          height={320}
          className="relative z-[1] h-10 w-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        />
        <span className="relative z-[1] flex flex-col text-left leading-tight">
          <span className="text-xs font-sans uppercase tracking-[0.2em] text-white/70">Site créé par</span>
          <span className="mt-0.5 font-serif text-base text-white">Vexel Webstudio</span>
        </span>
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-[1300] bg-ink/70 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOuvert(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Un site bâti pour durer"
        >
          <div className="relative w-full max-w-md bg-paper dark:bg-charcoal text-ink dark:text-stone-100 rounded-2xl overflow-hidden shadow-2xl p-8 pb-24">
            <div className="flex items-start justify-between gap-4">
              <img src="/vexel-logo.png" alt="Vexel Webstudio" className="h-14 w-auto object-contain" />
              <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-stone-500 hover:text-ink dark:hover:text-white shrink-0">
                <X size={20} />
              </button>
            </div>
            <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-2">un projet créatif du Salon des Inconnus</p>
            <h3 className="font-serif text-2xl mt-2">Un site bâti pour durer</h3>
            <p className="font-serif text-base opacity-80 leading-relaxed mt-3">
              Ce site a été conçu et bâti par Vexel Webstudio, un studio du Québec qui fait des sites sur
              mesure : le design, le code, l'espace client et l'administration que vous voyez ici.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 pr-20 sm:pr-24">
              <a
                href={VEXEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-ink dark:bg-stone-100 text-paper dark:text-forest font-sans text-xs font-bold uppercase tracking-[0.2em] min-h-[44px] px-6 rounded-full hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
              >
                Continuer vers Vexel <ArrowRight size={14} />
              </a>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="inline-flex items-center border border-stone-400/60 hover:border-ink dark:hover:border-stone-100 font-sans text-xs font-bold uppercase tracking-[0.2em] min-h-[44px] px-6 rounded-full transition-colors"
              >
                Pas maintenant
              </button>
            </div>
            <a
              href={SALON_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Le Salon des Inconnus"
              className="absolute bottom-5 right-5"
            >
              <img
                src="/salon-logo-or.png"
                alt="Le Salon des Inconnus"
                className="h-16 md:h-20 w-auto object-contain drop-shadow-[0_2px_6px_rgba(197,160,89,0.35)]"
              />
            </a>
          </div>
        </div>
      )}
    </>
  );
};
