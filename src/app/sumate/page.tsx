import { auth } from "@/auth";
import { SumateForm } from "./SumateForm";

export const dynamic = "force-dynamic";

export default async function SumatePage() {
  const session = await auth();
  const account = session?.user
    ? { nombre: session.user.name ?? "", rol: session.user.role }
    : null;

  return <SumateForm account={account} />;
}
