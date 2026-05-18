import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin, UserPlus, Users } from "lucide-react";
import { ServiceModal } from "../components/widgets/ServiceModal";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import { useTarifs, type Tarif } from "../hooks/useTarifs";
import type { Content } from "../i18n";

interface ConsultationCard {
  title: string;
  short: string;
  desc: string;
  image: string;
  price: number;
  durationMin?: number;
}

const tarifToCard = (t: Tarif): ConsultationCard => ({
  title: t.name,
  short: t.shortTag || (t.durationMin ? `${t.durationMin} min` : ""),
  desc: t.description,
  image: t.image || "",
  price: t.price,
  durationMin: t.durationMin,
});

export const Therapie = ({ content }: { content: Content["sections"]["therapie"] }) => {
  const { tarifs, loading } = useTarifs();
  const [selected, setSelected] = useState<ConsultationCard | null>(null);
  const [showGroupRequest, setShowGroupRequest] = useState(false);

  const consultations = useMemo(
    () =>
      tarifs
        .filter((t) => t.active && t.category === "consultation")
        .map(tarifToCard),
    [tarifs],
  );

  const goToClient = () => {
    setSelected(null);
    window.location.href = "/client";
  };

  return (
    <div className="space-y-12 animate-[fadeIn_1s_ease-out]">
      <div className="space-y-6">
        <h3 className="text-2xl font-light text-rust dark:text-stone-300">Soins offerts</h3>
        {loading ? (
          <p className="font-serif italic opacity-60">Chargement…</p>
        ) : consultations.length === 0 ? (
          <p className="font-serif italic opacity-60 py-4">
            Les soins seront bientôt accessibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consultations.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c)}
                className="group text-left border border-stone-300 dark:border-stone-600 rounded-[30px] hover:border-rust dark:hover:border-stone-300 transition-all duration-300 bg-white/40 dark:bg-white/5 overflow-hidden"
              >
                {c.image && (
                  <div className="aspect-[16/10] overflow-hidden bg-stone-200">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {c.short && (
                        <span className="block text-xs font-sans tracking-widest text-rust dark:text-stone-400 mb-2 uppercase">
                          {c.short}
                        </span>
                      )}
                      <h4 className="font-serif text-2xl mb-1 text-ink dark:text-stone-100 leading-tight">
                        {c.title}
                      </h4>
                      <p className="text-base font-sans text-rust dark:text-stone-300 mt-2">
                        {c.price.toFixed(0)} $
                        {c.durationMin && (
                          <span className="opacity-50 ml-1 text-sm">· {c.durationMin} min</span>
                        )}
                      </p>
                    </div>
                    <ArrowUpRight className="opacity-0 group-hover:opacity-100 transition-all text-rust dark:text-stone-300 shrink-0 mt-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ServiceModal
        service={selected}
        onClose={() => setSelected(null)}
        onBook={goToClient}
        bookLabel="Prendre Rendez-vous"
      />

      {content.locations && content.locations.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {content.locations.map((loc, i) => (
            <div key={i} className="flex-1 min-w-[200px] border border-stone-300 dark:border-stone-600 p-6 rounded-[30px] bg-paper/50 dark:bg-black/10">
              <div className="flex items-center gap-2 mb-2 text-rust dark:text-stone-300">
                <MapPin size={16} />
                <h4 className="font-sans uppercase tracking-widest text-xs font-bold">{loc.type}</h4>
              </div>
              <p className="font-serif text-lg text-ink dark:text-stone-200">{loc.desc}</p>
            </div>
          ))}
        </div>
      )}

      {showGroupRequest && (
        <InterventionRequestModal
          config={INTERVENTION_CONFIGS.therapie}
          onClose={() => setShowGroupRequest(false)}
        />
      )}

      <div className="pt-12 border-t border-stone-300 dark:border-stone-600 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rust/5 dark:bg-white/5 border border-rust/20 dark:border-white/10 rounded-[30px] p-6 md:p-8 text-center space-y-4">
          <UserPlus className="mx-auto text-rust dark:text-stone-300 opacity-70" size={26} aria-hidden="true" />
          <h3 className="text-xl md:text-2xl font-light leading-tight">
            Soin individuel
          </h3>
          <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Pour prendre rendez-vous, créez votre espace personnel.
          </p>
          <button
            onClick={goToClient}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-paper dark:bg-stone-100 dark:text-forest font-sans text-xs tracking-[0.25em] uppercase hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors rounded-full"
          >
            Créer un compte
          </button>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-50">
            Connexion Google ou courriel
          </p>
        </div>

        <div className="bg-stone-100/50 dark:bg-stone-800/30 border border-stone-300/40 dark:border-stone-600/40 rounded-[30px] p-6 md:p-8 text-center space-y-4">
          <Users className="mx-auto text-stone-600 dark:text-stone-300 opacity-70" size={26} aria-hidden="true" />
          <h3 className="text-xl md:text-2xl font-light leading-tight">
            Soin de groupe / corporatif
          </h3>
          <p className="font-serif italic text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Entreprise, équipe, cercle thérapeutique — décrivez-moi votre intention.
          </p>
          <button
            onClick={() => setShowGroupRequest(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-ink/30 dark:border-stone-300/30 font-sans text-xs tracking-[0.25em] uppercase hover:bg-ink hover:text-paper dark:hover:bg-stone-100 dark:hover:text-forest transition-colors rounded-full"
          >
            Demander pour un groupe
          </button>
        </div>
      </div>
    </div>
  );
};
