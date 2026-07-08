import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar, AdminMobileBar } from "@/components/admin/Sidebar";
import { countNewDiagnoses, countPendingReports } from "@/lib/data";

export const metadata: Metadata = {
  title: "Backoffice · Sinnergia Studio",
  robots: { index: false, follow: false },
};

// El middleware (src/middleware.ts) ya protege /admin, pero no confiamos
// en una sola barrera: esto vuelve a chequear el rol acá, del lado del
// servidor, antes de renderizar cualquier dato de negocio.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  // Contadores para los badges del sidebar (persistentes en todo el backoffice).
  const [nuevosDiagnosticos, reportesPendientes] = await Promise.all([
    countNewDiagnoses(),
    countPendingReports(),
  ]);
  const badges = {
    "/admin/empresas": nuevosDiagnosticos,
    "/admin/reportes": reportesPendientes,
  };

  return (
    <div className="min-h-screen bg-smoke text-ink">
      <Sidebar badges={badges} />
      <AdminMobileBar badges={badges} />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
