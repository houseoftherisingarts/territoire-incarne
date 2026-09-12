import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── La visite guidée de bienvenue ──────────────────────────────────
// Alex, 2026-09-12 : chaque site du parc explique son back-office en
// détail, section par section, à la première visite et sur demande.
// Une carte posée par-dessus l'admin, un anneau de lumière autour du
// bouton dont on parle, et la section qui s'ouvre d'elle-même à chaque
// étape. La zone se marque par `data-visite="<id>"`; une ancre absente
// ne casse rien, la carte se centre et la visite continue.

export interface EtapeVisite {
  titre: string;
  /** Deux ou trois phrases : la carte se lit d'un souffle. */
  corps: string;
  /** L'élément à mettre en évidence, marqué `data-visite`. */
  ancre?: string;
  /** La section à ouvrir en arrivant sur l'étape (par défaut, l'ancre). */
  aller?: string;
}

const CLE = 'territoire.visite-guidee';

export function visiteVue(): boolean {
  try { return localStorage.getItem(CLE) === '1'; } catch { return true; }
}
export function marquerVisiteVue(): void {
  try { localStorage.setItem(CLE, '1'); } catch { /* navigation privée */ }
}

/** La visite s'offre d'elle-même la première fois, puis se rouvre par le bouton. */
export function useVisiteGuidee(auto = true) {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    if (!auto || visiteVue()) return;
    const h = window.setTimeout(() => setOuvert(true), 1400);
    return () => window.clearTimeout(h);
  }, [auto]);
  return { ouvert, ouvrir: () => setOuvert(true), fermer: () => { marquerVisiteVue(); setOuvert(false); } };
}

interface Props {
  etapes: EtapeVisite[];
  ouvert: boolean;
  onFermer: () => void;
  /** Ouvre la section nommée par l'étape. */
  onAller?: (id: string) => void;
  libelles: { visite: string; etape: string; precedent: string; suivant: string; terminer: string; quitter: string };
}

interface Cadre { x: number; y: number; w: number; h: number }

const VisiteGuidee: React.FC<Props> = ({ etapes, ouvert, onFermer, onAller, libelles }) => {
  const [i, setI] = useState(0);
  const [cadre, setCadre] = useState<Cadre | null>(null);
  const etape = etapes[i];

  useEffect(() => { if (ouvert) setI(0); }, [ouvert]);

  // La section s'ouvre, puis l'ancre se mesure une fois posée.
  useEffect(() => {
    if (!ouvert || !etape) return;
    const cible = etape.aller ?? etape.ancre;
    if (cible && onAller) onAller(cible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, i]);

  const mesurer = useCallback(() => {
    if (!ouvert || !etape?.ancre) { setCadre(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-visite="${etape.ancre}"]`);
    if (!el || el.offsetParent === null) { setCadre(null); return; }
    const r = el.getBoundingClientRect();
    // Un menu replié hors de l'écran (le tiroir du téléphone) ne se cerne pas : la carte se centre.
    if (r.width === 0 || r.right < 0 || r.left > window.innerWidth) { setCadre(null); return; }
    setCadre({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 });
  }, [ouvert, etape]);

  useLayoutEffect(() => {
    mesurer();
    const h = window.setTimeout(mesurer, 380);
    window.addEventListener('resize', mesurer);
    window.addEventListener('scroll', mesurer, true);
    return () => { window.clearTimeout(h); window.removeEventListener('resize', mesurer); window.removeEventListener('scroll', mesurer, true); };
  }, [mesurer]);

  useEffect(() => {
    if (!ouvert) return;
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
      if (e.key === 'ArrowRight') setI((n) => Math.min(etapes.length - 1, n + 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [ouvert, etapes.length, onFermer]);

  if (!ouvert || !etape) return null;
  const derniere = i === etapes.length - 1;
  const large = typeof window !== 'undefined' && window.innerWidth >= 900;
  // Sur un grand écran, la carte se pose à droite de l'ancre; sur un
  // téléphone, elle monte du bas.
  const styleCarte: React.CSSProperties = large && cadre
    ? { position: 'fixed', left: Math.min(cadre.x + cadre.w + 18, window.innerWidth - 400), top: Math.max(16, Math.min(cadre.y, window.innerHeight - 320)), width: 380 }
    : large
      ? { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 420 }
      : { position: 'fixed', left: 12, right: 12, bottom: 12 };

  return createPortal(
    <div className="fixed inset-0 z-[700]" role="dialog" aria-modal="true" aria-label={libelles.visite}>
      {cadre ? (
        <div aria-hidden className="fixed pointer-events-none rounded-lg ring-2 ring-rust"
             style={{ left: cadre.x, top: cadre.y, width: cadre.w, height: cadre.h, boxShadow: '0 0 0 9999px rgba(20,24,20,0.6)' }} />
      ) : (
        <div aria-hidden className="fixed inset-0" style={{ background: 'rgba(20,24,20,0.6)' }} onClick={onFermer} />
      )}
      <div className="bg-paper dark:bg-charcoal text-ink dark:text-stone-100 border border-ink/10 dark:border-white/10 rounded-2xl shadow-2xl p-6 z-[701]" style={styleCarte}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-sans uppercase tracking-[0.3em] text-rust">{libelles.visite} · {i + 1} / {etapes.length}</p>
          <button type="button" onClick={onFermer} aria-label={libelles.quitter} className="w-9 h-9 rounded-full opacity-60 hover:opacity-100 text-xl leading-none">×</button>
        </div>
        <h2 className="font-serif text-2xl font-light leading-snug mb-2">{etape.titre}</h2>
        <p className="text-sm leading-relaxed opacity-85">{etape.corps}</p>
        <div className="flex gap-1 my-4" aria-hidden>
          {etapes.map((_, k) => <span key={k} className={`h-[3px] flex-1 rounded-full ${k <= i ? 'bg-rust' : 'bg-ink/10 dark:bg-white/10'}`} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onFermer} className="rounded-full border border-ink/20 dark:border-white/20 px-4 py-2 font-sans uppercase tracking-[0.2em] text-[11px] hover:border-rust">{libelles.quitter}</button>
          <div className="flex gap-2">
            <button type="button" disabled={i === 0} onClick={() => setI((n) => n - 1)} className="rounded-full border border-ink/20 dark:border-white/20 px-4 py-2 font-sans uppercase tracking-[0.2em] text-[11px] hover:border-rust disabled:opacity-40">{libelles.precedent}</button>
            <button type="button" onClick={() => (derniere ? onFermer() : setI((n) => n + 1))} className="rounded-full bg-ink text-paper dark:bg-rust dark:text-stone-100 px-5 py-2 font-sans uppercase tracking-[0.2em] text-[11px] hover:opacity-90">
              {derniere ? libelles.terminer : libelles.suivant}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default VisiteGuidee;

export const BoutonVisite: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ onClick, className = '', children }) => (
  <button type="button" onClick={onClick} className={className}>{children}</button>
);
