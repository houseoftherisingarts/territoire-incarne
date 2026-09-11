// Tests des règles Firestore et Storage : le jugement d'Élise (etape, revue) doit rester hors
// de portée de la cliente, les notes privées jamais lisibles par elle, les pièces du dossier
// bornées en taille et en type. Lancé via :
//   npm run test:rules
// (équivaut à PATH="$(brew --prefix openjdk@21)/bin:$PATH" npx firebase emulators:exec
//   --only firestore,storage --project territoire-incarne-test "node tests/rules.test.mjs")
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const UID_A = 'user-a';
const UID_B = 'user-b';
const ADMIN_UID = 'yDsFujEL8lUkEzrtFXQvgFoseH22'; // fruiterre@gmail.com, cf lib/admins.ts / firestore.rules

const profilValide = (uid) => ({
  uid,
  displayName: 'Personne A',
  email: 'a@example.com',
  avatarUrl: '',
  status: 'pending',
  newsletterOptIn: true,
  etape: 'contact',
  pieces: {},
});

const petitFichier = (octets = 100) => new Uint8Array(octets).fill(1);

let ok = 0;
let fail = 0;
const resultats = [];

async function verifie(nom, promesse) {
  try {
    await promesse;
    resultats.push(`✅ ${nom}`);
    ok++;
  } catch (e) {
    resultats.push(`❌ ${nom}\n   ${e.message.split('\n')[0]}`);
    fail++;
  }
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'territoire-incarne-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8182,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9298,
    },
  });

  const dbA = testEnv.authenticatedContext(UID_A).firestore();
  const dbB = testEnv.authenticatedContext(UID_B).firestore();
  const dbAdmin = testEnv.authenticatedContext(ADMIN_UID).firestore();
  const dbAnon = testEnv.unauthenticatedContext().firestore();

  const stA = testEnv.authenticatedContext(UID_A).storage();
  const stB = testEnv.authenticatedContext(UID_B).storage();
  const stAdmin = testEnv.authenticatedContext(ADMIN_UID).storage();

  // ── users/{uid} : profil et dossier ─────────────────────────────────────
  await verifie('la cliente crée son propre profil', assertSucceeds(setDoc(doc(dbA, 'users', UID_A), profilValide(UID_A))));
  await verifie('une autre cliente ne peut pas créer le profil de A', assertFails(setDoc(doc(dbB, 'users', UID_A), profilValide(UID_A))));

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', UID_A), profilValide(UID_A));
  });

  await verifie('la cliente modifie sa bio et son motif', assertSucceeds(updateDoc(doc(dbA, 'users', UID_A), {
    bio: 'Un peu de moi',
    projet: { titre: 'Ce qui m\'amène', description: 'Une phrase', objectif: '' },
  })));
  await verifie('la cliente dépose une pièce (map pieces)', assertSucceeds(updateDoc(doc(dbA, 'users', UID_A), {
    'pieces.motif': { nom: 'motif.pdf', url: 'https://x', chemin: 'dossiers/user-a/motif/1-motif.pdf', taille: 1000, type: 'application/pdf', deposeLe: serverTimestamp() },
  })));
  await verifie('la cliente ne peut PAS s\'attribuer le statut accepted', assertFails(updateDoc(doc(dbA, 'users', UID_A), { status: 'accepted' })));
  await verifie('la cliente ne peut PAS changer seancesRemaining', assertFails(updateDoc(doc(dbA, 'users', UID_A), { seancesRemaining: 999 })));
  await verifie('la cliente ne peut PAS avancer sa propre étape', assertFails(updateDoc(doc(dbA, 'users', UID_A), { etape: 'accompagnement' })));
  await verifie('la cliente ne peut PAS écrire sa propre revue (jugement de pièce)', assertFails(updateDoc(doc(dbA, 'users', UID_A), {
    'revue.motif': { etat: 'valide', revueLe: serverTimestamp() },
  })));
  await verifie('une bio de plus de 2000 caractères est refusée', assertFails(updateDoc(doc(dbA, 'users', UID_A), { bio: 'x'.repeat(2001) })));
  await verifie('une autre cliente ne peut pas modifier le profil de A', assertFails(updateDoc(doc(dbB, 'users', UID_A), { bio: 'intrusion' })));
  await verifie('une autre cliente ne peut pas lire le profil de A', assertFails(getDoc(doc(dbB, 'users', UID_A))));
  await verifie('Élise avance l\'étape et juge une pièce', assertSucceeds(updateDoc(doc(dbAdmin, 'users', UID_A), {
    etape: 'accueil',
    'revue.motif': { etat: 'valide', revueLe: serverTimestamp() },
  })));
  await verifie('Élise lit le profil de A', assertSucceeds(getDoc(doc(dbAdmin, 'users', UID_A))));

  // ── users/{uid}/notes : notes privées d'Élise ───────────────────────────
  await verifie('Élise ajoute une note privée sur A', assertSucceeds(addDoc(collection(dbAdmin, 'users', UID_A, 'notes'), { texte: 'Note', createdAt: serverTimestamp() })));
  await verifie('la cliente NE PEUT PAS lire ses propres notes privées', assertFails(getDocs(collection(dbA, 'users', UID_A, 'notes'))));
  await verifie('la cliente ne peut pas écrire dans ses propres notes', assertFails(addDoc(collection(dbA, 'users', UID_A, 'notes'), { texte: 'triche', createdAt: serverTimestamp() })));

  // ── bugs/{id} : bouton Problème technique ───────────────────────────────
  const bugValide = { uid: UID_A, nom: 'A', courriel: 'a@example.com', texte: 'Ça ne marche pas', statut: 'nouveau' };
  await verifie('la cliente signale un problème technique', assertSucceeds(addDoc(collection(dbA, 'bugs'), bugValide)));
  await verifie('la cliente ne peut pas signaler un bug au nom d\'une autre', assertFails(addDoc(collection(dbB, 'bugs'), { ...bugValide, uid: UID_A })));
  await verifie('un visiteur anonyme ne peut pas signaler de bug', assertFails(addDoc(collection(dbAnon, 'bugs'), bugValide)));

  // ── settings/{id} : catalogue du dossier, mode d'apparence ──────────────
  await verifie('n\'importe qui lit le catalogue du dossier', assertSucceeds(getDoc(doc(dbAnon, 'settings', 'dossier'))));
  await verifie('la cliente ne peut pas écrire le catalogue du dossier', assertFails(setDoc(doc(dbA, 'settings', 'dossier'), { pieces: [] })));
  await verifie('Élise écrit le catalogue du dossier', assertSucceeds(setDoc(doc(dbAdmin, 'settings', 'dossier'), { pieces: [], etapes: [] })));
  await verifie('Élise bascule le mode d\'apparence', assertSucceeds(setDoc(doc(dbAdmin, 'settings', 'apparence'), { mode: 'editorial' })));

  // ── Storage : dossiers/{uid} (pièces) ────────────────────────────────────
  await verifie('la cliente dépose un PDF de 100 o dans son dossier', assertSucceeds(
    uploadBytes(ref(stA, 'dossiers/user-a/motif/1-motif.pdf'), petitFichier(100), { contentType: 'application/pdf' }),
  ));
  await verifie('la cliente ne peut pas déposer un .exe', assertFails(
    uploadBytes(ref(stA, 'dossiers/user-a/motif/2-motif.exe'), petitFichier(100), { contentType: 'application/x-msdownload' }),
  ));
  await verifie('la cliente ne peut pas déposer plus de 25 Mo', assertFails(
    uploadBytes(ref(stA, 'dossiers/user-a/motif/3-gros.pdf'), petitFichier(26 * 1024 * 1024), { contentType: 'application/pdf' }),
  ));
  await verifie('une autre cliente ne peut pas déposer dans le dossier de A', assertFails(
    uploadBytes(ref(stB, 'dossiers/user-a/motif/4-intrusion.pdf'), petitFichier(100), { contentType: 'application/pdf' }),
  ));
  await verifie('Élise lit une pièce du dossier de A', assertSucceeds(getDownloadURL(ref(stAdmin, 'dossiers/user-a/motif/1-motif.pdf'))));

  // ── Storage : profils/{uid} (avatar, bannière) ──────────────────────────
  await verifie('la cliente dépose son avatar (image, < 5 Mo)', assertSucceeds(
    uploadBytes(ref(stA, 'profils/user-a/avatar-1.jpg'), petitFichier(100), { contentType: 'image/jpeg' }),
  ));
  await verifie('la cliente ne peut pas déposer un PDF comme avatar', assertFails(
    uploadBytes(ref(stA, 'profils/user-a/avatar-2.jpg'), petitFichier(100), { contentType: 'application/pdf' }),
  ));
  await verifie('une autre cliente ne peut pas écrire l\'avatar de A', assertFails(
    uploadBytes(ref(stB, 'profils/user-a/avatar-3.jpg'), petitFichier(100), { contentType: 'image/jpeg' }),
  ));

  // ── Storage : bugs/{uid} (captures d'écran) ─────────────────────────────
  await verifie('la cliente dépose une capture de bug', assertSucceeds(
    uploadBytes(ref(stA, 'bugs/user-a/1.jpg'), petitFichier(100), { contentType: 'image/jpeg' }),
  ));
  await verifie('une autre cliente ne peut pas lire la capture de A', assertFails(getDownloadURL(ref(stB, 'bugs/user-a/1.jpg'))));

  // ── Storage : media/ (médiathèque publique, admin seul en écriture) ────
  await verifie('un visiteur lit la médiathèque publique', assertSucceeds(getDownloadURL(ref(testEnv.unauthenticatedContext().storage(), 'media/photo.jpg')).catch((e) => {
    // L'objet n'existe pas dans l'émulateur (aucun setup préalable) : une 404 de l'émulateur
    // est un succès des RÈGLES (la lecture est autorisée, l'objet est simplement absent).
    if (String(e.message).includes('does not exist') || String(e.code) === 'storage/object-not-found') return;
    throw e;
  })));
  await verifie('la cliente ne peut pas écrire dans la médiathèque publique', assertFails(
    uploadBytes(ref(stA, 'media/intrusion.jpg'), petitFichier(100), { contentType: 'image/jpeg' }),
  ));
  await verifie('Élise écrit dans la médiathèque publique', assertSucceeds(
    uploadBytes(ref(stAdmin, 'media/photo.jpg'), petitFichier(100), { contentType: 'image/jpeg' }),
  ));

  // ── classes/{id}/requests et events/{id}/registrations : inscription directe, Interac, gratuit ──
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'classes', 'payant'), { title: 'Baladi', priceCents: 4500, capacity: 12, active: true });
    await setDoc(doc(ctx.firestore(), 'classes', 'gratuit'), { title: 'Cercle', priceCents: 0, capacity: 12, active: true });
    await setDoc(doc(ctx.firestore(), 'events', 'retraite'), { title: 'Retraite', priceCents: 12000, published: true });
    await setDoc(doc(ctx.firestore(), 'events', 'ouvert'), { title: 'Cercle ouvert', priceCents: 0, published: true });
  });
  await verifie('la cliente réserve sa place (pending) à un cours payant', assertSucceeds(setDoc(doc(dbA, 'classes/payant/requests', UID_A), { status: 'pending', paiement: 'interac', email: 'a@x' })));
  await verifie('la cliente ne peut PAS se marquer payée sur un cours payant', assertFails(setDoc(doc(dbA, 'classes/payant/requests', UID_A), { status: 'paid' })));
  await verifie('la cliente entre tout de suite (paid) dans un cours gratuit', assertSucceeds(setDoc(doc(dbA, 'classes/gratuit/requests', UID_A), { status: 'paid', email: 'a@x' })));
  await verifie('une autre cliente ne peut pas écrire la place de A', assertFails(setDoc(doc(dbB, 'classes/gratuit/requests', UID_A), { status: 'paid' })));
  await verifie('Élise marque payée une place Interac', assertSucceeds(setDoc(doc(dbAdmin, 'classes/payant/requests', UID_A), { status: 'paid' }, { merge: true })));
  await verifie('la cliente réserve (pending) une place à un événement payant', assertSucceeds(setDoc(doc(dbA, 'events/retraite/registrations', UID_A), { status: 'pending', paiement: 'interac' })));
  await verifie('la cliente ne peut PAS se confirmer sur un événement payant', assertFails(setDoc(doc(dbA, 'events/retraite/registrations', UID_A), { status: 'confirmed' })));
  await verifie('la cliente se confirme sur un événement gratuit', assertSucceeds(setDoc(doc(dbA, 'events/ouvert/registrations', UID_A), { status: 'confirmed' })));
  await verifie('un visiteur lit les occupations (miroir des créneaux pris)', assertSucceeds(getDocs(collection(dbAnon, 'occupations'))));
  await verifie('la cliente ne peut pas écrire une occupation', assertFails(setDoc(doc(dbA, 'occupations', 'x'), { start: new Date(), end: new Date(), source: 'rdv' })));
  await verifie('Élise elle-même ne lit pas prive/agenda_google', assertFails(getDoc(doc(dbAdmin, 'prive', 'agenda_google'))));
  await verifie('un visiteur lit settings/sections', assertSucceeds(getDoc(doc(dbAnon, 'settings', 'sections'))));
  await verifie('la cliente ne peut pas éteindre une section', assertFails(setDoc(doc(dbA, 'settings', 'sections'), { hidden: ['boutique'] })));

  await testEnv.cleanup();

  console.log(resultats.join('\n'));
  console.log(`\n${ok} réussis, ${fail} échoués.`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
