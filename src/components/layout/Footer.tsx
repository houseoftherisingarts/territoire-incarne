import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
import { isAdminUser } from "../../lib/admins";
import { pathForSection } from "../../routes";
import { useSections } from "../../hooks/useSections";
import { tx } from "../../i18n/tx";
import type { Content } from "../../i18n";
import type { Lang, SectionId } from "../../types";
import { BadgeVexel } from "../common/BadgeVexel";
import { db } from "../../firebase";
import { BadgeVexel as BadgePartenaireVexel } from "../../vexel/BadgeVexel";

interface Props {
  t: Content;
  lang: Lang;
  onOpen: (id: SectionId | null) => void;
  onToggleLang: () => void;
}

export const COURRIEL = "territoireincarne@gmail.com";

/** Le pied de page du site : pleine largeur, jamais enfermé dans une colonne. Il porte le
 *  sommaire, les coordonnées, l'espace client, le bouton de l'admin et le collant foil. */
export const Footer = ({ t, lang, onOpen, onToggleLang }: Props) => {
  const { visibles, estVisible } = useSections();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const admin = isAdminUser(user);

  const aller = (id: SectionId | null) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(id);
  };

  return (
    <footer className="w-full bg-ink text-paper dark:bg-charcoal border-t border-white/10">
      <div className="px-5 md:px-12 lg:px-16 pt-16 pb-12 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-12">
        <div className="md:col-span-4">
          <a href="/" onClick={aller(null)} className="font-serif text-3xl leading-none">Territoire Incarné</a>
          <p className="ed-kicker mt-3 text-paper/60">{tx(lang, "par Elise .G Lortie")}</p>
          <p className="mt-6 font-serif text-lg leading-relaxed text-paper/80 max-w-sm">
            {t.sections.apropos.intro.split(". ")[0]}.
          </p>
        </div>

        <nav className="md:col-span-2" aria-label={t.general.naviguer}>
          <p className="ed-kicker text-paper/50 mb-5">{t.general.naviguer}</p>
          <ul className="space-y-2">
            {visibles.map((id) => (
              <li key={id}>
                <a href={pathForSection(id)} onClick={aller(id)} className="font-serif text-lg text-paper/85 hover:text-paper transition-colors">
                  {t.nav[id]}
                </a>
              </li>
            ))}
            {estVisible("rendezvous") && (
              <li>
                <a href={pathForSection("rendezvous")} onClick={aller("rendezvous")} className="font-serif text-lg text-[#d9a58a] hover:text-paper transition-colors">
                  {t.general.prendreRdv}
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="ed-kicker text-paper/50 mb-5">{t.general.coordonnees}</p>
          <a href={`mailto:${COURRIEL}`} className="font-serif text-lg text-paper/85 hover:text-paper transition-colors break-all">
            {COURRIEL}
          </a>
          <p className="mt-2 font-serif text-lg text-paper/60">Québec</p>
          <ul className="mt-6 space-y-3">
            <li>
              <a href="/client" className="font-serif text-lg text-paper/85 hover:text-paper transition-colors">
                {user ? t.general.myClientSpace : t.general.clientSpace}
              </a>
            </li>
            <li>
              <a
                href="/admin"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-paper/30 font-sans text-xs uppercase tracking-[0.2em] font-semibold text-paper/85 hover:bg-paper hover:text-ink transition-colors"
              >
                <Lock size={13} strokeWidth={1.75} />
                {admin ? t.general.tableauDeBord : tx(lang, "Administration")}
              </a>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 flex flex-col items-start md:items-end gap-6">
          <BadgeVexel />
          <BadgePartenaireVexel db={db} />
          <button
            type="button"
            onClick={onToggleLang}
            className="font-sans text-xs uppercase tracking-[0.25em] text-paper/60 hover:text-paper transition-colors min-h-[44px]"
            aria-label={lang === "fr" ? "Switch to English" : "Passer au français"}
          >
            {lang === "fr" ? "English" : "Français"}
          </button>
        </div>
      </div>

      <div className="px-5 md:px-12 lg:px-16 py-5 border-t border-white/10 flex flex-wrap gap-x-8 gap-y-2 font-sans text-xs uppercase tracking-[0.25em] text-paper/45">
        <span>© {new Date().getFullYear()} Territoire Incarné · Elise .G Lortie</span>
        <span>{t.general.droits}</span>
      </div>
    </footer>
  );
};
