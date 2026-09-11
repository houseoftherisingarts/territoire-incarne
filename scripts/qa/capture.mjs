// Captures 1440 et 390 d'une adresse du site, connecté ou non, avec les vraies données.
//   node scripts/qa/capture.mjs <chemin> <prefixe-de-sortie> [--jeton /tmp/jeton.txt] [--clic "texte du bouton"] [--scroll 0,0.5,1]
// Exemples :
//   node scripts/qa/capture.mjs / scripts/qa/shots/accueil
//   JETON=/tmp/jeton-admin.txt node scripts/qa/capture.mjs /admin scripts/qa/shots/admin --clic "Clientes"
//   JETON=/tmp/jeton-client.txt node scripts/qa/capture.mjs /client scripts/qa/shots/client
// Le serveur Vite doit tourner sur le port 3110 (le 3000 sert un autre projet), ou
// BASE=http://localhost:4173 pour vite preview.
// Le jeton (scripts/qa/admin-jeton.mjs) se pose par signInWithCustomToken à travers le module
// que Vite sert : même instance Firebase que l'application, donc Firestore répond avec les
// vraies données.
import { chromium } from '/Users/lesalondesinconnus/Documents/Websites/FMM 2026/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const route = args[0] || '/';
const prefixe = args[1] || 'scripts/qa/shots/page';
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const BASE = process.env.BASE || 'http://localhost:3110';
const jetonPath = opt('--jeton') || process.env.JETON;
const clic = opt('--clic');
const scrolls = (opt('--scroll') || '0').split(',').map(Number);
fs.mkdirSync(path.dirname(prefixe), { recursive: true });
const token = jetonPath ? fs.readFileSync(jetonPath, 'utf8').trim() : null;

const b = await chromium.launch();
const rapport = { erreurs: [], mesures: [] };
for (const [w, h, tag] of [[1440, 900, '1440'], [390, 844, '390']]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, deviceScaleFactor: w < 600 ? 2 : 1, locale: 'fr-CA', reducedMotion: 'no-preference' });
  const p = await c.newPage();
  p.on('console', (m) => { if (m.type() === 'error') rapport.erreurs.push(`${tag}: ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => rapport.erreurs.push(`${tag} PAGEERROR: ${e.message.slice(0, 200)}`));
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  if (token) {
    await p.evaluate(async (t) => {
      // firebase.ts importe `firebase/auth` normalement; Vite en dev sert ce module déjà
      // réécrit avec l'import résolu vers le chunk de dépendances optimisées — on va le
      // chercher dans la source servie pour importer signInWithCustomToken depuis le MÊME
      // module que celui que l'app utilise (auth doit être la même instance).
      const src = await fetch('/src/firebase.ts').then((r) => r.text());
      const m = src.match(/"([^"]*firebase_auth\.js[^"]*)"/);
      const { auth } = await import('/src/firebase.ts');
      if (m) {
        const a = await import(m[1]);
        await a.signInWithCustomToken(auth, t);
      } else {
        // Repli : le module est déjà résolu par le graphe de l'app (rare en dev).
        const a = await import('firebase/auth');
        await a.signInWithCustomToken(auth, t);
      }
    }, token);
    await p.waitForTimeout(1500);
  }
  await p.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  if (clic) {
    for (const texte of clic.split(',')) {
      const cible = p.locator(`button:has-text("${texte}"), a:has-text("${texte}")`).first();
      if (await cible.count()) { await cible.click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(2000); }
    }
  }
  for (const s of scrolls) {
    await p.evaluate((f) => {
      const el = document.scrollingElement || document.documentElement;
      // DetailView.tsx défile dans son propre panneau, pas la page : trouver le plus haut
      // conteneur avec overflow-y réel plutôt que de deviner un id.
      const conteneurs = [...document.querySelectorAll('*')].filter((e) => {
        const st = getComputedStyle(e);
        return (st.overflowY === 'auto' || st.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4;
      });
      const cible = conteneurs[0] || el;
      cible.scrollTo(0, (cible.scrollHeight - cible.clientHeight) * f);
    }, s);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${prefixe}-${tag}-${Math.round(s * 100)}.jpg`, type: 'jpeg', quality: 72 });
  }
  const m = await p.evaluate(() => {
    const petits = [...document.querySelectorAll('body *')].filter((e) => {
      const st = getComputedStyle(e); const fs = parseFloat(st.fontSize);
      return fs && fs < 13 && e.innerText && e.innerText.trim().length > 0 && e.getClientRects().length > 0 && st.visibility !== 'hidden' && st.opacity !== '0';
    }).length;
    const italiques = [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).fontStyle === 'italic' && e.innerText && e.innerText.trim().length > 0 && e.getClientRects().length > 0).length;
    const titres = [...document.querySelectorAll('h1,h2,h3')].filter((e) => parseFloat(getComputedStyle(e).fontSize) > 24 && e.getClientRects().length > 0).map((e) => {
      const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
      return { texte: e.innerText.slice(0, 60), lignes: Math.round(e.getBoundingClientRect().height / lh) };
    }).filter((t) => t.lignes > 2);
    const tirets = (document.body.innerText.match(/—/g) || []).length;
    return { titre: document.title, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, textesSous13px: petits, italiques, titresTroisLignes: titres, tiretsLongs: tirets, modeAttribut: document.documentElement.getAttribute('data-mode') };
  });
  rapport.mesures.push({ tag, ...m });
  await c.close();
}
await b.close();
fs.writeFileSync(`${prefixe}-rapport.json`, JSON.stringify(rapport, null, 2));
console.log(JSON.stringify(rapport, null, 1));
