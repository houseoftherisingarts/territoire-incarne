/** Single source of truth for admin Firebase UIDs.
 *  When Elise's primary admin account changes, update PRIMARY_ADMIN_UID +
 *  add the new UID to ADMIN_UIDS. Also update firestore.rules to match. */

/** The "canonical" admin used for chat/profile-skip identity. */
export const PRIMARY_ADMIN_UID = "yDsFujEL8lUkEzrtFXQvgFoseH22";

/** All UIDs allowed to access /admin. */
export const ADMIN_UIDS: readonly string[] = [
  "yDsFujEL8lUkEzrtFXQvgFoseH22", // fruiterre@gmail.com  (added 2026-05-01)
  "BYR9pdEGCfYpU5kmbMoyRr9paRq1", // legacy admin — remove once new account is verified
];

export const isAdmin = (uid: string | null | undefined): boolean =>
  !!uid && ADMIN_UIDS.includes(uid);
