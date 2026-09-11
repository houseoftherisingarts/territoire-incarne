interface Props {
  onHome: () => void;
}

/** Page 404 : le chemin ne correspond à aucune section, aucun écrit, aucune vue admin ou client. */
export const NotFound = ({ onHome }: Props) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-paper dark:bg-forest text-ink dark:text-stone-100 px-6 text-center">
    <div>
      <p className="text-xs font-sans uppercase tracking-[0.3em] text-rust mb-4">Territoire Incarné</p>
      <h1 className="text-6xl font-light mb-4">404</h1>
      <p className="font-serif text-xl mb-8">Cette page n'existe pas.</p>
      <button
        onClick={onHome}
        className="inline-flex items-center gap-2 bg-ink dark:bg-stone-100 text-paper dark:text-forest px-6 py-3 rounded-xl font-sans uppercase tracking-[0.25em] text-xs font-bold hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  </div>
);
