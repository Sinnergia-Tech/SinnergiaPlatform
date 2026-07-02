import type { Metadata } from "next";
import { Sidebar, AdminMobileBar } from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: "Backoffice · Sinnergia Studio",
  robots: { index: false, follow: false },
};

// La protección por rol la maneja el middleware (src/middleware.ts).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-smoke text-ink">
      <Sidebar />
      <AdminMobileBar />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
