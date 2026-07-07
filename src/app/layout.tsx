import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

// La indexación está APAGADA por defecto (sitio en construcción). Para permitir
// que los buscadores indexen al lanzar: setear ALLOW_INDEXING="true" en Vercel
// y re-deployar. Ver también src/app/robots.ts.
const allowIndexing = process.env.ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  title: "Sinnergia Studio — Definamos el QUÉ, te explicamos el CÓMO",
  description:
    "Sinnergia no es una agencia, ni una bolsa de trabajo, ni una consultora tradicional. Ayudamos a las empresas a entender qué necesitan y con quién resolverlo.",
  metadataBase: new URL("https://sinnergia.studio"),
  robots: allowIndexing ? undefined : { index: false, follow: false },
  openGraph: {
    title: "Sinnergia Studio",
    description:
      "Definamos el QUÉ. Nosotros te explicamos el CÓMO.",
    type: "website",
  },
  icons: {
    icon: "/brand/logo-negro.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
