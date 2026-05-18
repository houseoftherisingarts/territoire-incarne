import { useEffect, useState } from "react";
import type { SectionId } from "../types";
import { pathForSection, pathForPost, sectionForPath, slugForPath } from "../routes";

interface RouteState {
  view: SectionId | null;
  postSlug: string | null;
}

const read = (): RouteState =>
  typeof window === "undefined"
    ? { view: null, postSlug: null }
    : {
        view: sectionForPath(window.location.pathname),
        postSlug: slugForPath(window.location.pathname),
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
