/**
 * Capa de acceso a datos — PREPARADA, aún no conectada.
 *
 * En la Fase 2 se conecta Postgres (Neon / Supabase). Recomendación: Prisma
 * como ORM (esquema tipado + migraciones versionadas).
 *
 * Pasos para activar (día de la conexión):
 *   1. npm i -D prisma && npm i @prisma/client
 *   2. npx prisma init  (crea /prisma/schema.prisma)
 *   3. Completar DATABASE_URL en .env.local
 *   4. Modelar entidades (ver src/lib/schema-notes.md)
 *   5. npx prisma migrate dev --name init
 *   6. Reemplazar el stub de abajo por el cliente real:
 *
 *      import { PrismaClient } from "@prisma/client";
 *      const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
 *      export const db = globalForPrisma.prisma ?? new PrismaClient();
 *      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
 */

export const DB_READY = false;

export function assertDbConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está configurada. Completá .env.local antes de usar la base de datos."
    );
  }
}
