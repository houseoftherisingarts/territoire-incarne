import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { isAdminUser } from "./admins";
import { useSiteOverrides } from "../hooks/useSiteOverrides";

interface SiteEditContextShape {
  /** True when admin is logged in AND ?edit=1 is in the URL. */
  editing: boolean;
  /** True as soon as an admin is logged in, edit mode on or off. */
  admin: boolean;
  /** Map of all overrides (live). */
  overrides: Record<string, string>;
  /** Get value: override if present, otherwise the default. */
  read: (key: string, defaultValue: string) => string;
}

const ctx = createContext<SiteEditContextShape>({
  editing: false,
  admin: false,
  overrides: {},
  read: (_, d) => d,
});

export const useSiteEdit = () => useContext(ctx);

export const SiteEditProvider = ({ children }: { children: ReactNode }) => {
  const { overrides } = useSiteOverrides();
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [hasEditFlag, setHasEditFlag] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAdminAuthed(isAdminUser(u)));
    return unsub;
  }, []);

  useEffect(() => {
    const check = () => {
      const params = new URLSearchParams(window.location.search);
      setHasEditFlag(params.get("edit") === "1");
    };
    check();
    window.addEventListener("popstate", check);
    return () => window.removeEventListener("popstate", check);
  }, []);

  const editing = adminAuthed && hasEditFlag;

  const read = (key: string, defaultValue: string): string =>
    overrides[normalizeKey(key)] ?? defaultValue;

  return <ctx.Provider value={{ editing, admin: adminAuthed, overrides, read }}>{children}</ctx.Provider>;
};

const normalizeKey = (key: string): string => key.replace(/\//g, "__").replace(/\./g, "_");
