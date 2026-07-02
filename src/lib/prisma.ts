import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton (evita múltiples instancias en dev con hot-reload).
 * Se usa desde la capa de datos (src/lib/data.ts) y los server actions.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
