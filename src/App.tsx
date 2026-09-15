import { useEffect, useState, lazy, Suspense } from "react";
import { Home } from "./components/layout/Home";
import { DetailView } from "./components/layout/DetailView";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { EditModeBar } from "./components/edit/EditModeBar";
import { NotFound } from "./components/common/NotFound";
import { getContent } from "./i18n";
import { LangContext } from "./i18n/tx";
import { NAV_ORDER } from "./types";

const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })),
);
const ClientPortal = lazy(() =>
  import("./components/client/ClientPortal").then((m) => ({ default: m.ClientPortal })),
);
import { useCart } from "./hooks/useCart";
import { useLang } from "./hooks/useLang";
import { useRoute } from "./hooks/useRoute";
import { useTheme } from "./hooks/useTheme";
import { useSections } from "./hooks/useSections";
import { useSeo } from "./hooks/useSeo";

const readAdminMode  = () => typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
const readClientMode = () => typeof window !== "undefined" && window.location.pathname.startsWith("/client");

export const App = () => {
  const { lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const { view, postSlug, notFound, navigate, navigateToPost } = useRoute();
  const { cart, subtotal, add: addToCart, removeAt: removeFromCart } = useCart();
  const { estVisible, loading: sectionsLoading } = useSections();
  const [adminMode,  setAdminMode]  = useState(readAdminMode);
  const [clientMode, setClientMode] = useState(readClientMode);

  useEffect(() => {
    const onPop = () => {
      setAdminMode(readAdminMode());
      setClientMode(readClientMode());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const t = getContent(lang);
  // Une section éteinte par Élise répond comme une page absente.
  const eteinte = !!view && !sectionsLoading && !estVisible(view);
  const introuvable = notFound || eteinte;
  useSeo(introuvable ? null : view, t, introuvable);

  // font-serif so the "Territoire Incarné" brand title keeps Poppins
  // inside the portals too (explicit font-sans classes still win where set).
  if (clientMode) return <div className="font-serif"><Suspense fallback={null}><ClientPortal /></Suspense></div>;
  if (adminMode)  return <div className="font-serif"><Suspense fallback={null}><AdminDashboard /></Suspense></div>;
  if (introuvable) return <NotFound t={t} onHome={() => navigate(null)} />;

  const index = view ? NAV_ORDER.indexOf(view) : -1;

  return (
    <LangContext.Provider value={lang}>
    <div className="min-h-[100dvh] w-full flex flex-col font-serif selection:bg-stone-300 dark:selection:bg-stone-600 selection:text-ink bg-paper dark:bg-forest text-ink dark:text-stone-100 relative transition-colors duration-500">
      <a href="#contenu" className="skip-link">{lang === "en" ? "Skip to content" : "Aller au contenu"}</a>

      <div className={view ? "" : "absolute inset-x-0 top-0 z-40"}>
        <Header
          t={t}
          lang={lang}
          theme={theme}
          current={view}
          accueil={!view}
          onOpen={(id) => navigate(id)}
          onToggleLang={toggleLang}
          onToggleTheme={toggleTheme}
        />
      </div>

      {view ? (
        <DetailView
          id={view}
          index={index}
          lang={lang}
          t={t}
          navTitle={view === "rendezvous" ? t.general.prendreRdv : t.nav[view]}
          onOpenPost={navigateToPost}
          postSlug={postSlug}
          cart={cart}
          subtotal={subtotal}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      ) : (
        <Home t={t} onOpen={(id) => navigate(id)} />
      )}

      <Footer t={t} lang={lang} onOpen={(id) => navigate(id)} onToggleLang={toggleLang} />
      <EditModeBar />
    </div>
    </LangContext.Provider>
  );
};
