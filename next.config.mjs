/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma y bcrypt corren solo en el servidor; no se empaquetan en el bundle.
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
