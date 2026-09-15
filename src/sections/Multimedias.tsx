import { useMemo } from "react";
import { Video, Podcast } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestoreCollection";
import type { Content } from "../i18n";
import type { Multimedia } from "../components/admin/MultimediasAdminSection";
import { Reveal } from "../components/motion/Reveal";

const YT_RE = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

type Embed = { kind: "iframe" | "video" | "audio" | "lien"; src: string; podcast?: boolean };

/** Les seuls hôtes qu'un cadre embarqué peut charger; tout le reste devient un lien. */
const HOTES_CADRE = ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com", "open.spotify.com", "embed.podcasts.apple.com"];
const httpsSeulement = (u: string): URL | null => { try { const x = new URL(u); return x.protocol === "https:" ? x : null; } catch { return null; } };
const cadreSur = (src: string, podcast?: boolean): Embed => { const x = httpsSeulement(src); return x && HOTES_CADRE.includes(x.hostname) ? { kind: "iframe", src: x.toString(), podcast } : { kind: "lien", src }; };

/** Traduit l'adresse déposée par Élise en lecteur embarqué. Jamais de bouton qui ouvre
 *  un nouvel onglet : YouTube et Vimeo passent par leur iframe, Spotify et Apple Podcasts
 *  par la leur, et un fichier audio ou vidéo direct se joue avec la balise native. */
const embedFor = (m: Multimedia): Embed => {
  if (!httpsSeulement(m.url)) return { kind: "lien", src: m.url };
  const url = m.url.trim();
  if (m.type === "video") {
    const yt = url.match(YT_RE);
    if (yt) return cadreSur(`https://www.youtube-nocookie.com/embed/${yt[1]}`);
    const vimeo = url.match(VIMEO_RE);
    if (vimeo) return cadreSur(`https://player.vimeo.com/video/${vimeo[1]}`);
    if (/\.(mp4|webm|mov|ogv)(\?.*)?$/i.test(url)) return { kind: "video", src: url };
    return cadreSur(url);
  }
  if (m.plateforme === "spotify") {
    const src = url.includes("/embed/") ? url : url.replace("open.spotify.com/", "open.spotify.com/embed/");
    return cadreSur(src, true);
  }
  if (m.plateforme === "apple") {
    return cadreSur(url.replace("podcasts.apple.com", "embed.podcasts.apple.com"), true);
  }
  if (/\.(mp3|m4a|wav|ogg|aac)(\?.*)?$/i.test(url)) return { kind: "audio", src: url };
  return cadreSur(url, true);
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
};

/** La page Multimédias : les vidéos et les balados d'Élise, chacun avec son lecteur
 *  embarqué directement dans la page. */
export const Multimedias = ({ content }: { content: Content["sections"]["multimedias"] }) => {
  // Pas d'orderBy dans la requête : combiné à where(), Firestore exigerait un index composite.
  // Le tri par « ordre » se fait donc côté client, comme pour les ateliers.
  const options = useMemo(() => ({ where: [["publie", "==", true] as [string, "==", true]] }), []);
  const { items, loading } = useFirestoreCollection<Multimedia>("multimedias", options);
  const tries = [...items].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  return (
    <div className="w-full">
      <p className="max-w-3xl font-serif text-2xl md:text-3xl font-light leading-snug text-ink/85 dark:text-stone-200">
        {content.intro}
      </p>

      {loading && (
        <p className="mt-14 font-serif text-lg text-ink/50 dark:text-stone-400">Chargement…</p>
      )}

      {!loading && tries.length === 0 && (
        <p className="mt-14 font-serif text-lg text-ink/60 dark:text-stone-400 border-t border-ink/10 dark:border-white/10 pt-10">
          Les premières vidéos arrivent.
        </p>
      )}

      {!loading && tries.length > 0 && (
        <ul className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
          {tries.map((m, i) => {
            const embed = embedFor(m);
            return (
              <Reveal key={m.id} delay={i * 0.04}>
                <li className="border-t border-ink/10 dark:border-white/10 pt-6">
                  <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.18em] text-ink/50 dark:text-stone-400">
                    {m.type === "video" ? <Video size={14} aria-hidden="true" /> : <Podcast size={14} aria-hidden="true" />}
                    <span>{m.type === "video" ? "Vidéo" : "Balado"}</span>
                    {m.date && <span>· {fmtDate(m.date)}</span>}
                  </div>

                  <h3 className="mt-3 font-serif text-2xl md:text-3xl text-ink dark:text-stone-100">{m.titre}</h3>

                  {m.description && (
                    <p className="mt-3 font-serif text-lg leading-relaxed text-ink/75 dark:text-stone-300 whitespace-pre-line">
                      {m.description}
                    </p>
                  )}

                  <div className="mt-5 w-full bg-ink/[0.03] dark:bg-white/[0.03]">
                    {embed.kind === "lien" && (
                      <a href={httpsSeulement(embed.src) ? embed.src : undefined} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 p-5 font-sans text-xs uppercase tracking-[0.18em] text-rust hover:bg-rust/5 transition-colors">
                        <span>Ouvrir sur le site d'origine</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    )}
                    {embed.kind === "iframe" && embed.podcast && (
                      <iframe
                        src={embed.src}
                        title={m.titre}
                        className="w-full h-[152px] md:h-[175px]"
                        style={{ border: 0 }}
                        loading="lazy"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      />
                    )}
                    {embed.kind === "iframe" && !embed.podcast && (
                      <div className="w-full aspect-video">
                        <iframe
                          src={embed.src}
                          title={m.titre}
                          className="w-full h-full"
                          style={{ border: 0 }}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {embed.kind === "video" && (
                      <video src={embed.src} controls className="w-full aspect-video" />
                    )}
                    {embed.kind === "audio" && (
                      <audio src={embed.src} controls className="w-full" />
                    )}
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
};
