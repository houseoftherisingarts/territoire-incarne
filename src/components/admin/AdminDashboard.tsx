import { useState } from "react";
import { AdminLogin } from "./AdminLogin";
import { AdminShell, type AdminSectionId } from "./AdminShell";
import {
  DashboardSection,
  FinancesSection,
  BookingsSection,
  MessagesSection,
  SettingsSection,
} from "./sections";
import { NewsletterAdminSection } from "./NewsletterAdminSection";
import { LeadsSection } from "./LeadsSection";
import { ProductsSection } from "./ProductsSection";
import { EventsAdminSection } from "./EventsAdminSection";
import { ClassesAdminSection } from "./ClassesAdminSection";
import { ResourcesSection } from "./ResourcesSection";
import { InterventionsSection } from "./InterventionsSection";
import { AdminBlogSection } from "./blog/AdminBlogSection";
import { AdminCalendarSection } from "./calendar/CalendarSection";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAdminStore } from "../../hooks/useAdminStore";
import { ClientsSection } from "./ClientsSection";
import { TarifsSection } from "./TarifsSection";

export const AdminDashboard = () => {
  const { authed, loading, login, logout, enableDevBypass } = useAdminAuth();
  const { data, update, reset } = useAdminStore();
  const [section, setSection] = useState<AdminSectionId>("dashboard");

  if (loading) return null;
  if (!authed) return <AdminLogin onLogin={login} onDevBypass={enableDevBypass} />;

  return (
    <AdminShell section={section} onSectionChange={setSection} onLogout={logout}>
      {section === "dashboard"  && <DashboardSection data={data} onNavigate={setSection} />}
      {section === "clients"    && <ClientsSection />}
      {section === "prospects"     && <LeadsSection />}
      {section === "interventions" && <InterventionsSection />}
      {section === "tarifs"     && <TarifsSection />}
      {section === "calendar"   && <AdminCalendarSection />}
      {section === "finances"   && (
        <FinancesSection
          transactions={data.transactions}
          onChange={(next) => update("transactions", next)}
        />
      )}
      {section === "bookings"   && (
        <BookingsSection bookings={data.bookings} onChange={(next) => update("bookings", next)} />
      )}
      {section === "messages"   && (
        <MessagesSection messages={data.messages} onChange={(next) => update("messages", next)} />
      )}
      {section === "boutique"   && <ProductsSection />}
      {section === "events"     && <EventsAdminSection />}
      {section === "cours"      && <ClassesAdminSection />}
      {section === "ressources" && <ResourcesSection />}
      {section === "writings"   && <AdminBlogSection />}
      {section === "newsletter" && <NewsletterAdminSection />}
      {section === "settings"   && <SettingsSection onReset={reset} />}
    </AdminShell>
  );
};
