import { useEffect, useState } from "react";
import type { SectionId } from "../types";
import { pathForSection, pathForPost, sectionForPath, slugForPath } from "../routes";

interface RouteState {
  view: SectionId | null;
  postSlug: string | null;
  notFound: boolean;
}

const KNOWN_PREFIXES = ["/admin", "/client"];

const read = (): RouteState => {
  if (typeof window === "undefined") return { view: null, postSlug: null, notFound: false };
  const path = window.location.pathname;
  const view = sectionForPath(path);
  const postSlug = slugForPath(path);
  const known =
    path === "/" ||
    view !== null ||
    postSlug !== null ||
    KNOWN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  return { view, postSlug, notFound: !known };
};

export const useRoute = () => {
  const [state, setState] = useState<RouteState>(read);

  useEffect(() => {
    const onPop = () => setState(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: SectionId | null) => {
    const target = next ? pathForSection(next) : "/";
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    setState({ view: next, postSlug: null });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const navigateToPost = (slug: string) => {
    const target = pathForPost(slug);
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    setState({ view: "writings", postSlug: slug });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return { view: state.view, postSlug: state.postSlug, navigate, navigateToPost };
};
