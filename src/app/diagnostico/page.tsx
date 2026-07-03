import { auth } from "@/auth";
import { DiagnosticoForm } from "./DiagnosticoForm";

export const dynamic = "force-dynamic";

export default async function DiagnosticoPage() {
  const session = await auth();
  const loggedInEmpresa = session?.user?.role === "empresa" && !!session.user.companyId;

  return (
    <DiagnosticoForm loggedInEmpresa={loggedInEmpresa} nombre={session?.user?.name ?? ""} />
  );
}
