import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account-guard";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { FreelancerPanel } from "@/components/account/FreelancerPanel";
import { EmpresaPanel } from "@/components/account/EmpresaPanel";
import { AccountSettings } from "@/components/account/AccountSettings";
import { SocialLinksEditor } from "@/components/account/SocialLinksEditor";
import { ReactivateAccount } from "@/components/account/ReactivateAccount";
import { Container } from "@/components/ui/Container";
import { getFreelancerData, getEmpresaData, countUnreadContacts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const { session, disabled, disabledByAdmin } = await requireAccount();

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
            <ReactivateAccount suspendedByAdmin={disabledByAdmin} />
          </Container>
        </main>
      </div>
    );
  }

  const freelancerData =
    role === "freelancer" && professionalId
      ? await getFreelancerData(professionalId)
      : null;
  const empresaData =
    role === "empresa" && companyId ? await getEmpresaData(companyId) : null;
  const prof = freelancerData?.professional;

  const unreadContacts =
    role === "freelancer" && professionalId
      ? await countUnreadContacts(professionalId)
      : 0;

  return (
    <div className="min-h-screen bg-smoke">
      <AccountTopbar user={{ nombre, rol: role }} unreadContacts={unreadContacts} />
      <main className="py-10">
        <Container className="max-w-[1000px] space-y-6">
          {freelancerData && <FreelancerPanel data={freelancerData} />}
          {empresaData && <EmpresaPanel company={empresaData} />}
          {prof && (
            <SocialLinksEditor
              initial={{
                instagram: prof.instagram,
                facebook: prof.facebook,
                linkedin: prof.linkedin,
              }}
            />
          )}
          <AccountSettings />
        </Container>
      </main>
    </div>
  );
}
