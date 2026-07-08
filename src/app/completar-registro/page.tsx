import { redirect } from "next/navigation";
import { verifyOnboardingToken } from "@/lib/google-onboarding";
import { CompletarRegistroForm } from "./CompletarRegistroForm";

export const dynamic = "force-dynamic";

export default async function CompletarRegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const identity = verifyOnboardingToken(t);
  // Sin token válido no hay nada que completar (link vencido o acceso directo).
  if (!identity || !t) redirect("/login");

  return <CompletarRegistroForm token={t} nombre={identity.name} />;
}
