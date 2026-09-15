import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import { EditableText } from "../components/edit/EditableText";
import { Reveal } from "../components/motion/Reveal";
import type { Content } from "../i18n";

/** Consultante en consentement : une page courte, faite pour qu'une production, une équipe ou
 *  un lieu la réserve. Le formulaire porte les questions; le texte se récrit sur la page. */
export const Consentement = ({ content }: { content: Content["sections"]["consentement"] }) => {
  const [ouvert, setOuvert] = useState(false);
  const config = INTERVENTION_CONFIGS.consentement;

  return (
    <div className="space-y-16">
      <Reveal>
        <div className="max-w-3xl font-serif text-xl leading-relaxed text-ink/75 dark:text-stone-300">
          <EditableText
            as="p"
            contentKey="consentement.texte"
            defaultValue="Formée à la Roue du consentement de Betty Martin, Elise .G Lortie accompagne le consentement là où il se joue pour vrai : sur un plateau où des scènes d'intimité se tournent, dans une équipe, dans un lieu de vie. Elle prépare les personnes, tient le cadre pendant, et reste disponible après."
          />
        </div>
      </Reveal>

      <Reveal>
        <ul className="border-t border-ink/10 dark:border-white/10">
          {content.contextes.map((_c, i) => (
            <li key={i} className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 py-7 border-b border-ink/10 dark:border-white/10">
              <span className="md:col-span-5 font-serif text-2xl md:text-3xl font-light leading-tight text-ink dark:text-stone-100"><EditableText i18n={`sections.consentement.contextes.${i}.titre`} /></span>
              <span className="md:col-span-7 font-serif text-lg leading-relaxed text-ink/65 dark:text-stone-300"><EditableText i18n={`sections.consentement.contextes.${i}.texte`} /></span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal>
        <div>
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="inline-flex items-center gap-3 bg-rust text-paper font-sans text-xs uppercase tracking-[0.22em] font-semibold min-h-[52px] pl-7 pr-2 rounded-full hover:bg-ink dark:hover:bg-stone-100 dark:hover:text-forest transition-colors"
          >
            <EditableText contentKey={`formulaire.${config.id}.cta`} defaultValue={config.ctaLabel} />
            <span className="w-9 h-9 rounded-full bg-paper/15 flex items-center justify-center"><ArrowUpRight size={16} /></span>
          </button>
          {config.ctaSubtitle && (
            <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-ink/50 dark:text-stone-400"><EditableText contentKey={`formulaire.${config.id}.cta-sous`} defaultValue={config.ctaSubtitle ?? ""} /></p>
          )}
        </div>
      </Reveal>

      {ouvert && <InterventionRequestModal config={config} onClose={() => setOuvert(false)} />}
    </div>
  );
};
