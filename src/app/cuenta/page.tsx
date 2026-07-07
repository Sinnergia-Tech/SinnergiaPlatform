import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account-guard";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { FreelancerPanel } from "@/components/account/FreelancerPanel";
import { EmpresaPanel } from "@/components/account/EmpresaPanel";
import { AccountSettings } from "@/components/account/AccountSettings";
import { ReactivateAccount } from "@/components/account/ReactivateAccount";
import { Container } from "@/components/ui/Container";
import { getFreelancerData, getEmpresaData, countUnreadContacts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const { session, disabled } = await requireAccount();

  const { role, professionalId, companyId } = session.user;
  const nombre = session.user.name ?? "";

  if (role === "admin") redirect("/admin");

  // Cuenta deshabilitada manualmente: solo ofrecemos reactivar.
  if (disabled) {
    return (
      <div className="min-h-screen bg-smoke">
        <AccountTopbar user={{ nombre, rol: role }} />
        <main className="py-10">
          <Container className="max-w-[560px]">
            <ReactivateAccount />
          </Container>
        </main>
      </div>
    );
  }

  const unreadContacts =
    role === "freelancer" && professionalId
      ? await countUnreadContacts(professionalId)
      : 0;

  return (
    <div className="min-h-screen bg-smoke">
      <AccountTopbar user={{ nombre, rol: role }} unreadContacts={unreadContacts} />
      <main className="py-10">
        <Container className="max-w-[1000px] space-y-6">
          {role === "freelancer" && professionalId && (
            <FreelancerPanel data={await getFreelancerData(professionalId)} />
          )}
          {role === "empresa" && companyId && (
            <EmpresaPanel company={await getEmpresaData(companyId)} />
          )}
          <AccountSettings />
        </Container>
      </main>
    </div>
  );
}
