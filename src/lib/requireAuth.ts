import { auth } from "../firebase";

const RETURN_TO_KEY = "returnTo";

interface MinimalUser {
  uid: string;
}

/**
 * Gate an action behind authentication.
 *
 * If the user is signed in, runs `action` and returns true.
 * If not, navigates to `/client?returnTo=<currentPath>` and returns false.
 *
 * Pass the user from your component's auth hook for accuracy — `auth.currentUser`
 * may be null on first paint before `onAuthStateChanged` fires.
 */
export const requireAuth = (
  user: MinimalUser | null | undefined,
  action?: () => void,
): boolean => {
  if (user) {
    action?.();
    return true;
  }
  const returnTo = window.location.pathname + window.location.search + window.location.hash;
  const params = new URLSearchParams({ [RETURN_TO_KEY]: returnTo });
  window.location.href = `/client?${params.toString()}`;
  return false;
};

/** Read the returnTo URL from the current location, if present and same-origin. */
export const consumeReturnTo = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const target = params.get(RETURN_TO_KEY);
  if (!target) return null;
  // Same-origin sanity check: must start with "/" and not "//"
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
};

/** Synchronous fallback for non-React contexts (uses auth.currentUser). */
export const requireAuthSync = (action?: () => void): boolean =>
  requireAuth(auth.currentUser, action);
