import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

export default function RestablecerContrasenaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-blanco.png"
            alt="Sinnergia"
            className="h-12 w-12 object-contain"
          />
          <h1 className="mt-6 text-2xl font-light">Restablecer contraseña</h1>
          <p className="mt-2 text-sm text-paper/50">Elegí tu nueva contraseña.</p>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
