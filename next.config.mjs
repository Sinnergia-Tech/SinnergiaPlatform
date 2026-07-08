const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js inyecta scripts inline para el payload de RSC/hidratación.
  // En dev además hace falta 'unsafe-eval': el HMR de webpack envuelve los
  // módulos en eval() para los source maps — sin esto, toda la interactividad
  // del cliente se rompe en `next dev` (no hace falta en producción).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Hay estilos inline puntuales (animationDelay, barras de progreso) + Google Fonts.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // fotoUrl de profesionales puede ser una URL externa a futuro; blob: es la
  // vista previa local antes de subir una foto (URL.createObjectURL).
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma y bcrypt corren solo en el servidor; no se empaquetan en el bundle.
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  // Default de Next es 1mb — hace falta más para subir fotos de perfil
  // (el límite real de tamaño de archivo se valida en src/lib/storage.ts).
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
