import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { FreelancerPanel } from "@/components/account/FreelancerPanel";
import { EmpresaPanel } from "@/components/account/EmpresaPanel";
import { Container } from "@/components/ui/Container";
import { getFreelancerData, getEmpresaData, countUnreadContacts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, professionalId, companyId } = session.user;
  const nombre = session.user.name ?? "";

  if (role === "admin") redirect("/admin");

  const unreadContacts =
    role === "freelancer" && professionalId
      ? await countUnreadContacts(professionalId)
      : 0;

  return (
    <div className="min-h-screen bg-smoke">
      <AccountTopbar user={{ nombre, rol: role }} unreadContacts={unreadContacts} />
      <main className="py-10">
        <Container className="max-w-[1000px]">
          {role === "freelancer" && professionalId && (
            <FreelancerPanel data={await getFreelancerData(professionalId)} />
          )}
          {role === "empresa" && companyId && (
            <EmpresaPanel company={await getEmpresaData(companyId)} />
          )}
        </Container>
      </main>
    </div>
  );
}
