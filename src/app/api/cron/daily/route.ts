import { NextResponse } from "next/server";
import {
  findUsersToWarnForInactivity,
  markInactivityWarned,
  purgeExpiredAuthArtifacts,
  findContactsNeedingReminder,
  markContactsReminded,
  findStalePendingProfessionals,
} from "@/lib/data";
import {
  sendInactivityWarningEmail,
  sendContactReminderEmail,
  sendAdminModerationDigest,
} from "@/lib/email";

// Job de mantenimiento diario. Vercel Cron lo dispara una vez por día (ver
// vercel.json) e incluye `Authorization: Bearer ${CRON_SECRET}` cuando la env
// var CRON_SECRET está seteada. El endpoint es idempotente y seguro de reintentar.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const summary: Record<string, unknown> = {};

  // 1. Aviso de inactividad (≥25 días sin loguear, sin aviso previo).
  const toWarn = await findUsersToWarnForInactivity();
  await Promise.all(
    toWarn.map((u) =>
      sendInactivityWarningEmail({
        nombre: u.nombre,
        email: u.email,
        loginUrl: `${siteUrl}/login`,
      })
    )
  );
  if (toWarn.length) await markInactivityWarned(toWarn.map((u) => u.id));
  summary.inactivityWarned = toWarn.length;

  // 2. Higiene: tokens vencidos/usados + rate-limit viejo.
  summary.purged = await purgeExpiredAuthArtifacts();

  // 3. Recordatorio de solicitudes de contacto sin responder (≥3 días).
  const contacts = await findContactsNeedingReminder();
  await Promise.all(
    contacts.map((c) =>
      sendContactReminderEmail({
        freelancerNombre: c.professional.nombre,
        freelancerEmail: c.professional.email,
        empresaNombre: c.company.nombre,
        url: `${siteUrl}/cuenta/contactos/${c.id}`,
      })
    )
  );
  if (contacts.length) await markContactsReminded(contacts.map((c) => c.id));
  summary.contactReminders = contacts.length;

  // 4. Digest al admin: profesionales en moderación hace ≥2 días.
  const pendientes = await findStalePendingProfessionals();
  if (pendientes.length) {
    await sendAdminModerationDigest({
      pendientes: pendientes.map((p) => ({
        nombre: p.nombre,
        titular: p.titular,
        dias: Math.floor((Date.now() - p.createdAt.getTime()) / DAY_MS),
      })),
      url: `${siteUrl}/admin/profesionales`,
    });
  }
  summary.pendingModeration = pendientes.length;

  return NextResponse.json({ ok: true, ...summary });
}
