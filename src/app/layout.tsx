import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinnergia Studio — Definamos el QUÉ, te explicamos el CÓMO",
  description:
    "Sinnergia no es una agencia, ni una bolsa de trabajo, ni una consultora tradicional. Ayudamos a las empresas a entender qué necesitan y con quién resolverlo.",
  metadataBase: new URL("https://sinnergia.studio"),
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
