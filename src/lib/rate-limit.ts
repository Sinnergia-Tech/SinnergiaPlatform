import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting respaldado en la DB (sin Redis/Upstash): cuenta hits de una
 * key dentro de una ventana de tiempo. Funciona bien en serverless porque no
 * depende de memoria de proceso.
 */
export async function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number }
) {
  const since = new Date(Date.now() - opts.windowMs);

  // Poda oportunista: evita que la tabla crezca sin límite.
  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: since } },
  });

  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: since } },
  });
  if (count >= opts.max) return false;

  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}

export async function getClientIp() {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
