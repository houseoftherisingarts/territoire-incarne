/* Verification de l'horaire des cours de groupe.
   Lancer : node scripts/test-group-schedule.ts */
import assert from "node:assert/strict";
import {
  seanceEnCours, prochaineSeance, classeEnDirect, expirationSalle,
  versChampLocal, depuisChampLocal, type Seance,
} from "../src/lib/groupSchedule.ts";

const dans = (minutes: number) => new Date(Date.now() + minutes * 60000).toISOString();
const s = (debut: string, duree = 90, id = "x"): Seance => ({ id, titre: "Rencontre", debut, duree });

// La porte s'ouvre 15 minutes avant et se ferme a la fin.
assert.equal(seanceEnCours(s(dans(10))), true, "dans le quart d'heure qui precede");
assert.equal(seanceEnCours(s(dans(-30))), true, "pendant la rencontre");
assert.equal(seanceEnCours(s(dans(20))), false, "trop tot");
assert.equal(seanceEnCours(s(dans(-120))), false, "apres la fin");
assert.equal(seanceEnCours(s("pas une date")), false, "date illisible");

// La prochaine rencontre est la plus proche encore ouverte.
const tard = s(dans(600), 90, "tard");
const bientot = s(dans(60), 90, "bientot");
const passee = s(dans(-600), 90, "passee");
assert.equal(prochaineSeance([tard, bientot, passee])?.id, "bientot");
assert.equal(prochaineSeance([passee]), null, "tout est passe");
assert.equal(prochaineSeance([]), null);
assert.equal(classeEnDirect([tard, s(dans(-5))]), true);
assert.equal(classeEnDirect([tard]), false);

// La salle vit un jour de plus que la derniere rencontre.
const maintenant = Date.now();
const finDerniere = maintenant + 600 * 60000 + 90 * 60000;
assert.equal(
  expirationSalle([tard, bientot], maintenant),
  Math.round((finDerniere + 24 * 3600_000) / 1000),
  "un jour apres la derniere rencontre",
);
assert.ok(
  expirationSalle([], maintenant) > Math.round((maintenant + 29 * 24 * 3600_000) / 1000),
  "horaire vide : trente jours",
);
assert.ok(
  expirationSalle([passee], maintenant) >= Math.round((maintenant + 3600_000) / 1000),
  "jamais une expiration deja passee",
);

// Le champ de saisie et l'instant range font l'aller-retour sans deriver.
const champ = "2026-09-10T19:00";
assert.equal(versChampLocal(depuisChampLocal(champ)), champ, "aller-retour");
assert.match(depuisChampLocal(champ), /Z$/, "range en instant complet");
assert.equal(depuisChampLocal("n'importe quoi"), "");
assert.equal(versChampLocal(""), "");

console.log("horaire des groupes : tout passe");
