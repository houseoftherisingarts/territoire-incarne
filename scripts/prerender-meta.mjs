// Post-build : écrit dist/<route>/index.html avec titre, description, canonique, Open Graph et
// JSON-LD propres à chaque page, puis dist/sitemap.xml et dist/404.html, pour que les moteurs,
// les partages et les robots d'IA voient le bon head sans JavaScript. Les sections éteintes par
// Élise (settings/sections dans Firestore, lecture publique) sortent du plan du site et se
// marquent noindex.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ORIGINE = 'https://territoireincarne.com';
const PROJET = 'territoireincarne-80bb9';

// Une seule source pour les titres et les phrases : le fichier i18n français d'Élise.
const fr = readFileSync(join(root, 'src/i18n/fr.ts'), 'utf8');
const champ = (section, cle) => {
  const bloc = fr.slice(fr.indexOf(`    ${section}: {`));
  const m = bloc.match(new RegExp(`${cle}:\\s*\\n?\\s*"([^"]+)"`));
  return m ? m[1] : '';
};

const PAGES = [
  { id: null, slug: '', titre: 'Territoire Incarné | Elise .G Lortie', desc: 'Elise .G Lortie tisse des espaces où le corps redevient un territoire de vérité. Thérapie somatique, mouvement, éducation, retraites.', type: 'WebPage' },
  { id: 'therapie', slug: 'therapie', type: 'Service' },
  { id: 'rendezvous', slug: 'rendez-vous', type: 'WebPage' },
  { id: 'mouvement', slug: 'mouvement', type: 'Service' },
  { id: 'events', slug: 'evenements', type: 'CollectionPage' },
  { id: 'apropos', slug: 'a-propos', type: 'AboutPage' },
  { id: 'writings', slug: 'ecrits', type: 'Blog' },
  { id: 'ressources', slug: 'ressources', type: 'CollectionPage' },
  { id: 'boutique', slug: 'boutique', type: 'CollectionPage' },
  { id: 'connecter', slug: 'connecter', type: 'ContactPage' },
].map((p) => (p.id ? { ...p, titre: `${champ(p.id, 'title')} | Territoire Incarné`, desc: champ(p.id, 'intro') } : p));

// Sections éteintes : lecture publique du document settings/sections (règles : allow read if true).
let eteintes = new Set();
try {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJET}/databases/(default)/documents/settings/sections`);
  if (r.ok) {
    const j = await r.json();
    for (const v of j.fields?.hidden?.arrayValue?.values ?? []) eteintes.add(v.stringValue);
  }
} catch (e) {
  console.warn('prerender-meta : settings/sections illisible, toutes les sections sont prérendues.', e.message);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const base = readFileSync(join(root, 'dist/index.html'), 'utf8');

const jsonLdPage = (p, url) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': p.type,
  '@id': `${url}#page`,
  url,
  name: p.titre.replace(' | Territoire Incarné', ''),
  description: p.desc,
  inLanguage: 'fr-CA',
  isPartOf: { '@id': `${ORIGINE}/#website` },
  about: { '@id': `${ORIGINE}/#organisation` },
  ...(p.type === 'Service' ? { provider: { '@id': `${ORIGINE}/#organisation` }, areaServed: 'CA-QC' } : {}),
});

let ecrites = 0;
for (const p of PAGES) {
  const url = `${ORIGINE}/${p.slug}`;
  const cachee = p.id && eteintes.has(p.id);
  let html = base
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.titre)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(p.desc)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.titre)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(p.desc)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(p.titre)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(p.desc)}$2`);
  if (p.id) html = html.replace('</head>', `    <script type="application/ld+json">${jsonLdPage(p, url)}</script>\n  </head>`);
  if (cachee) html = html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
  const dir = join(root, 'dist', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  ecrites++;
}

// 404 : même coquille, noindex, servie par Firebase Hosting pour tout chemin inconnu.
writeFileSync(
  join(root, 'dist/404.html'),
  base
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Page introuvable | Territoire Incarné</title>')
    .replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'),
);

const jour = new Date().toISOString().slice(0, 10);
const visibles = PAGES.filter((p) => !(p.id && eteintes.has(p.id)));
writeFileSync(
  join(root, 'dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${visibles
    .map((p) => `  <url><loc>${ORIGINE}/${p.slug}</loc><lastmod>${jour}</lastmod>${p.slug ? '' : '<priority>1.0</priority>'}</url>`)
    .join('\n')}\n</urlset>\n`,
);
console.log(`prerender-meta : ${ecrites} pages écrites (${eteintes.size} éteinte(s)), sitemap.xml et 404.html posés.`);
