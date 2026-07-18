import { useEffect, useState, lazy, Suspense } from "react";
import { IMG_GLOBAL_BG } from "./assets/images";
import { LangThemeToggles } from "./components/common/LangThemeToggles";
import { Home } from "./components/layout/Home";
import { DetailView } from "./components/layout/DetailView";
import { EditModeBar } from "./components/edit/EditModeBar";
import { getContent } from "./i18n";

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

const readAdminMode  = () => typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
const readClientMode = () => typeof window !== "undefined" && window.location.pathname.startsWith("/client");

export const App = () => {
  const { lang, toggle: toggleLang } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const { view, postSlug, navigate, navigateToPost } = useRoute();
  const { cart, subtotal, add: addToCart, removeAt: removeFromCart } = useCart();
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

  // font-serif so the "Territoire Incarné" brand title keeps Cormorant Garamond
  // inside the portals too (explicit font-sans classes still win where set).
  if (clientMode) return <div className="font-serif"><Suspense fallback={null}><ClientPortal /></Suspense></div>;
  if (adminMode)  return <div className="font-serif"><Suspense fallback={null}><AdminDashboard /></Suspense></div>;

  return (
    <div className="h-screen w-full font-serif selection:bg-stone-300 dark:selection:bg-stone-600 selection:text-ink overflow-hidden bg-paper dark:bg-forest text-ink dark:text-stone-100 relative transition-colors duration-500">
      <a href="#contenu" className="skip-link">{lang === "en" ? "Skip to content" : "Aller au contenu"}</a>
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-multiply dark:mix-blend-overlay opacity-5 dark:opacity-10">
        <img src={IMG_GLOBAL_BG} className="w-full h-full object-cover opacity-60" alt="" loading="lazy" decoding="async" fetchPriority="low" />
      </div>

      <LangThemeToggles
        lang={lang}
        theme={theme}
        onToggleLang={toggleLang}
        onToggleTheme={toggleTheme}
        clientSpaceLabel={t.general.clientSpace}
        myClientSpaceLabel={t.general.myClientSpace}
      />

      <div
        id="contenu"
        className={`transition-all duration-[2000ms] ease-in-out h-full ${
          view ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}
      >
        <Home t={t} onOpen={(id) => navigate(id)} />
      </div>

      {view && (
        <DetailView
          id={view}
          lang={lang}
          t={t}
          navTitle={t.nav[view]}
          closeText={t.general.close}
          onClose={() => navigate(null)}
          onOpenPost={navigateToPost}
          postSlug={postSlug}
          cart={cart}
          subtotal={subtotal}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      )}

      <EditModeBar />
    </div>
  );
};
