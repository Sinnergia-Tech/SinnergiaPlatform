import { notFound } from "next/navigation";
import { getProfessionalWithPortfolio, getAccountByProfessionalId } from "@/lib/data";
import { ProfesionalEditor } from "@/components/admin/ProfesionalEditor";
import { AdminAccountPanel } from "@/components/admin/AdminAccountPanel";
import { AdminPortfolioModeration } from "@/components/admin/AdminPortfolioModeration";
import { serializeAccount } from "@/lib/account-serialize";

export const dynamic = "force-dynamic";

export default async function ProfesionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, account] = await Promise.all([
    getProfessionalWithPortfolio(id),
    getAccountByProfessionalId(id),
  ]);
  if (!p) notFound();
  return (
    <>
      <ProfesionalEditor initial={p} />
      <div className="mt-4">
        <AdminAccountPanel account={serializeAccount(account)} />
      </div>
      <div className="mt-4">
        <AdminPortfolioModeration
          professionalId={p.id}
          descripcion={p.portfolioDescripcion}
          imagenes={p.portfolioImagenes}
          items={p.portfolio.map((it) => ({
            id: it.id,
            titulo: it.titulo,
            descripcion: it.descripcion,
            imagenUrl: it.imagenUrl,
            enlace: it.enlace,
          }))}
        />
      </div>
    </>
  );
}
