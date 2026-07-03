import { consumeEmailVerificationToken } from "@/lib/data";
import { ResendVerificationForm } from "@/components/account/ResendVerificationForm";

export const dynamic = "force-dynamic";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await consumeEmailVerificationToken(token) : { ok: false as const };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/isotipo-blanco.png"
          alt="Sinnergia"
          className="mx-auto h-12 w-12 object-contain"
        />

        {result.ok ? (
          <>
            <h1 className="mt-6 text-2xl font-light">Email confirmado</h1>
            <p className="mt-2 text-sm text-paper/60">
              Tu cuenta ya está activa. Iniciá sesión para continuar.
            </p>
            <a
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85"
            >
              Ir a iniciar sesión
            </a>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-light">Enlace inválido o vencido</h1>
            <p className="mt-2 text-sm text-paper/60">
              Pedí un nuevo enlace de verificación con tu email.
            </p>
            <ResendVerificationForm />
          </>
        )}
      </div>
    </main>
  );
}
