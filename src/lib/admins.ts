import type { User } from "firebase/auth";

/** Source unique des administratrices du site. Deux portes : l'UID Firebase (comptes déjà
 *  créés) ou le courriel VÉRIFIÉ (compte Google). Le courriel seul ne suffit jamais : un compte
 *  créé par mot de passe avec le courriel d'une autre personne n'est pas vérifié, donc pas admin.
 *  Tenir `firestore.rules` et `storage.rules` alignés sur ces deux listes. */

/** Le compte « canonique » d'Élise, utilisé pour l'identité du fil de messages. */
export const PRIMARY_ADMIN_UID = "yDsFujEL8lUkEzrtFXQvgFoseH22";

export const ADMIN_UIDS: readonly string[] = [
  "yDsFujEL8lUkEzrtFXQvgFoseH22", // fruiterre@gmail.com (mot de passe, 2026-05-01)
  "BYR9pdEGCfYpU5kmbMoyRr9paRq1", // alex@lesalondesinconnus.com (mot de passe)
  "v5CuWU6AithXyyW684dwDoUkXF03", // houseoftherisingarts@gmail.com (Google, 2026-09-11)
];

export const ADMIN_EMAILS: readonly string[] = [
  "territoireincarne@gmail.com", // Élise, compte Google (2026-09-11)
  "fruiterre@gmail.com",
  "houseoftherisingarts@gmail.com",
  "alex@lesalondesinconnus.com",
];

export const isAdmin = (uid: string | null | undefined): boolean =>
  !!uid && ADMIN_UIDS.includes(uid);

/** Vrai si l'utilisateur connecté est admin par UID ou par courriel vérifié. */
export const isAdminUser = (user: Pick<User, "uid" | "email" | "emailVerified"> | null | undefined): boolean =>
  !!user && (isAdmin(user.uid) || (user.emailVerified && !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())));
