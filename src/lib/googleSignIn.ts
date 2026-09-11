import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
} from "firebase/auth";

/** Codes d'erreur après lesquels la fenêtre surgissante ne rendra jamais de résultat à la
 *  page (fenêtre bloquée, stockage tiers cloisonné, fenêtre refermée) : on repart alors par
 *  redirection, qui garde tout au premier niveau. */
const CODES_REDIRECTION = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/missing-initial-state",
  "auth/web-storage-unsupported",
  "auth/operation-not-supported-in-this-environment",
]);

const fournisseur = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  return p;
};

/** Connexion Google : fenêtre surgissante d'abord, redirection en repli. Rejette avec le code
 *  Firebase réel pour que l'écran de connexion puisse le montrer plutôt qu'un message générique. */
export const connexionGoogle = async (auth: Auth): Promise<void> => {
  try {
    await signInWithPopup(auth, fournisseur());
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    if (CODES_REDIRECTION.has(code)) {
      await signInWithRedirect(auth, fournisseur());
      return;
    }
    throw err;
  }
};

/** À appeler une fois au montage, avant d'écouter onAuthStateChanged : récupère le résultat d'une
 *  connexion par redirection. Silencieux quand il n'y en a pas. */
export const recupererRedirection = (auth: Auth): Promise<void> =>
  getRedirectResult(auth)
    .then(() => undefined)
    .catch((err) => {
      console.warn("Retour de redirection Google :", (err as { code?: string })?.code);
    });

/** Message lisible pour un code d'erreur Firebase Auth. */
export const messageErreurAuth = (err: unknown): string => {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "Ce domaine n'est pas autorisé pour la connexion Google.";
    case "auth/account-exists-with-different-credential":
      return "Un compte existe déjà avec ce courriel. Connectez-vous avec votre mot de passe.";
    case "auth/network-request-failed":
      return "Le réseau n'a pas répondu. Réessayez.";
    case "auth/popup-closed-by-user":
      return "La fenêtre Google s'est refermée avant la fin.";
    default:
      return code ? `Connexion impossible (${code}).` : "Connexion impossible. Réessayez.";
  }
};
