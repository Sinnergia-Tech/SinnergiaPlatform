import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DiagnosticoForm } from "./DiagnosticoForm";

export const dynamic = "force-dynamic";

export default async function DiagnosticoPage() {
  const session = await auth();

  // El diagnóstico es solo para empresas con cuenta y email ya validado.
  // (El login bloquea las cuentas sin verificar, así que toda sesión activa
  // implica email verificado.) Un anónimo va primero a crear su cuenta; un
  // usuario logueado que no sea empresa (freelancer/admin) va a su panel.
  if (!session?.user) redirect("/crear-cuenta");
  if (session.user.role !== "empresa" || !session.user.companyId) {
    redirect(session.user.role === "admin" ? "/admin" : "/cuenta");
  }

  return <DiagnosticoForm loggedInEmpresa nombre={session.user.name ?? ""} />;
}
