/**
 * Carga inicial de datos (seed).
 *
 * Ejecutar: npm run db:seed   (requiere DATABASE_URL y `prisma migrate` corrido)
 *
 * Crea:
 *  - Usuarios: admin (de env) + un freelancer demo y una empresa demo.
 *  - Datos de ejemplo: profesionales, empresas, diagnósticos y matches.
 *
 * Es idempotente (usa upsert): se puede correr varias veces sin duplicar.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  professionals,
  companies,
  diagnoses,
  matchRequests,
} from "../src/lib/mock-data";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@sinnergia.studio";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "sinnergia-admin";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

async function main() {
  console.log("→ Seed: profesionales…");
  for (const p of professionals) {
    const data = {
      nombre: p.nombre,
      email: p.email,
      whatsapp: p.whatsapp ?? null,
      linkedin: p.linkedin ?? null,
      instagram: p.instagram ?? null,
      portfolioUrl: p.portfolioUrl ?? null,
      titular: p.titular,
      descripcion: p.descripcion,
      roles: p.roles,
      rubros: p.rubros,
      skills: p.skills,
      tecnologias: p.tecnologias,
      idiomas: p.idiomas,
      experiencia: p.experiencia,
      honorarios: p.honorarios,
      modalidad: p.modalidad,
      disponibilidad: p.disponibilidad,
      ubicacion: p.ubicacion ?? null,
      estado: p.estado,
      destacado: p.destacado,
      createdAt: new Date(p.createdAt),
    };
    await prisma.professional.upsert({
      where: { id: p.id },
      update: data,
      create: { id: p.id, ...data },
    });
  }

  console.log("→ Seed: empresas…");
  for (const c of companies) {
    const data = {
      nombre: c.nombre,
      contacto: c.contacto,
      email: c.email,
      telefono: c.telefono ?? null,
      rubro: c.rubro,
      tamano: c.tamano ?? null,
      sitioWeb: c.sitioWeb ?? null,
      origen: c.origen ?? null,
      createdAt: new Date(c.createdAt),
    };
    await prisma.company.upsert({
      where: { id: c.id },
      update: data,
      create: { id: c.id, ...data },
    });
  }

  console.log("→ Seed: diagnósticos…");
  for (const d of diagnoses) {
    const data = {
      companyId: d.companyId,
      rubro: d.rubro,
      facturacion: d.facturacion ?? null,
      objetivos: d.objetivos,
      presupuesto: d.presupuesto,
      equipoActual: d.equipoActual ?? null,
      problemaPrincipal: d.problemaPrincipal,
      respuestasExtra: d.respuestasExtra ?? undefined,
      estadoLead: d.estadoLead,
      notas: d.notas ?? null,
      createdAt: new Date(d.createdAt),
    };
    await prisma.diagnosis.upsert({
      where: { id: d.id },
      update: data,
      create: { id: d.id, ...data },
    });
  }

  console.log("→ Seed: matches…");
  for (const m of matchRequests) {
    await prisma.matchRequest.upsert({
      where: { id: m.id },
      update: {
        companyId: m.companyId,
        diagnosisId: m.diagnosisId ?? null,
        contexto: m.contexto,
        estado: m.estado,
        resultado: m.resultado ?? null,
        createdAt: new Date(m.createdAt),
      },
      create: {
        id: m.id,
        companyId: m.companyId,
        diagnosisId: m.diagnosisId ?? null,
        contexto: m.contexto,
        estado: m.estado,
        resultado: m.resultado ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
    // Candidatos
    for (const cand of m.candidatos) {
      await prisma.matchCandidate.upsert({
        where: {
          matchRequestId_professionalId: {
            matchRequestId: m.id,
            professionalId: cand.professionalId,
          },
        },
        update: { puntaje: cand.puntaje, seleccionado: cand.seleccionado },
        create: {
          matchRequestId: m.id,
          professionalId: cand.professionalId,
          puntaje: cand.puntaje,
          seleccionado: cand.seleccionado,
        },
      });
    }
  }

  console.log("→ Seed: usuarios…");
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Cuentas provistas por seed: se consideran ya verificadas (no pasan por
  // el flujo de verificación de email, que es sólo para auto-registro).
  const now = new Date();

  // Admin. Los administradores reales se gestionan por fuera del seed (cuentas
  // nominales del equipo). Por eso el `update` NO pisa la contraseña ni el nombre
  // de un admin que ya exista: re-correr el seed no debe resetear credenciales
  // reales. Sólo garantiza que, en una base nueva, exista el admin de arranque.
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", emailVerified: now },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      nombre: "Equipo Sinnergia",
      role: "admin",
      emailVerified: now,
    },
  });

  // Freelancer demo (vinculado a un profesional)
  await prisma.user.upsert({
    where: { email: "nico@example.com" },
    update: { passwordHash: demoHash, nombre: "Nicolás Ferraro", role: "freelancer", professionalId: "p1", emailVerified: now },
    create: {
      email: "nico@example.com",
      passwordHash: demoHash,
      nombre: "Nicolás Ferraro",
      role: "freelancer",
      professionalId: "p1",
      emailVerified: now,
    },
  });

  // Empresa demo (vinculada a una empresa)
  await prisma.user.upsert({
    where: { email: "lucia@janos.example" },
    update: { passwordHash: demoHash, nombre: "Jano's", role: "empresa", companyId: "c1", emailVerified: now },
    create: {
      email: "lucia@janos.example",
      passwordHash: demoHash,
      nombre: "Jano's",
      role: "empresa",
      companyId: "c1",
      emailVerified: now,
    },
  });

  console.log("✓ Seed completo.");
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Freelancer demo: nico@example.com / ${DEMO_PASSWORD}`);
  console.log(`  Empresa demo: lucia@janos.example / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
