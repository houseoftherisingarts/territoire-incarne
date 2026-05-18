import { Pencil, X } from "lucide-react";
import { useSiteEdit } from "../../lib/siteEdit";

/** Floating bar shown across the public site whenever Elise is in edit mode. */
export const EditModeBar = () => {
  const { editing } = useSiteEdit();
  if (!editing) return null;

  const exit = () => {
    // Strip ?edit=1 from the URL and reload state
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goAdmin = () => {
    window.location.href = "/admin";
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-rust text-paper rounded-full shadow-2xl flex items-center gap-3 px-5 py-3 text-xs font-sans uppercase tracking-widest font-bold">
      <Pencil size={14} className="animate-pulse" />
      <span>Mode édition</span>
      <span className="opacity-60 normal-case font-serif italic text-[10px]">
        Cliquez sur un texte ou une image pour modifier
      </span>
      <button onClick={goAdmin} className="ml-3 underline opacity-80 hover:opacity-100">
        Tableau de bord
      </button>
      <button onClick={exit} className="inline-flex items-center gap-1 bg-paper/20 hover:bg-paper/40 rounded-full px-3 py-1 text-[10px]">
        <X size={11} /> Quitter
      </button>
    </div>
  );
};
