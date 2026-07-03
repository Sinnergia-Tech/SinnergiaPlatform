# CLAUDE.md — Guía de trabajo del proyecto

Contexto persistente para retomar el desarrollo de **Sinnergia Platform** en futuras
sesiones. Leer esto antes de empezar a trabajar.

## Qué es

Plataforma web de **Sinnergia Studio**: consultoría + red curada de profesionales +
match entre empresas y colaboradores. La visión de largo plazo es una membresía/comunidad.
Concepto de marca: *"Definamos el QUÉ. Nosotros te explicamos el CÓMO."*
No es una agencia — es un estudio / laboratorio de ideas.

## Stack

- **Next.js (App Router) + React + TypeScript**
- **Tailwind CSS v4** (config vía CSS en `src/app/globals.css`, tokens en `@theme`)
- Tipografía: **Jost** (sustituto web de Century Gothic), cargada desde Google Fonts.
- Base de datos: **PostgreSQL en Supabase** + Prisma (integración EN CURSO). Cliente en `src/lib/prisma.ts`, schema en `prisma/schema.prisma`.
- Hosting objetivo: **Vercel** + Supabase. Almacenamiento de archivos: **Vercel Blob**
  (se eligió por simplicidad de setup ya estando en Vercel; se descartó Cloudflare R2
  del plan original). Ver `src/lib/storage.ts`.

## Regla de marca (estricta)

Paleta **solo negro `#000000` y blanco `#FFFFFF`** (+ grises neutros para UI). Sin color.
Estética editorial, monocromática, mucho aire. Tokens: `ink`, `paper`, `smoke`, `ash`,
`graphite`, `mute` (definidos en `globals.css`).
Logos en `public/brand/` — usar `isotipo-*.png` para íconos, `logo-*.png` para lockups.

## Estructura

```
src/
  app/
    layout.tsx, page.tsx, globals.css   # landing pública (Fase 1)
    diagnostico/        # formulario empresa (Fase 2)
    sumate/             # formulario freelancer (Fase 2)
    (backoffice)/       # route group AISLADO del sitio público
      login/            # login admin (UI)
      admin/            # panel: dashboard, profesionales, empresas, matches
  components/           # secciones de la landing + ui/ (primitivas)
    admin/              # componentes del backoffice (sidebar, tabla, badges…)
  lib/
    types.ts            # tipos del dominio (Professional, Company, Diagnosis, Match…)
    catalogs.ts         # catálogos (roles, rubros, modalidades, presupuesto…)
    mock-data.ts        # datos de ejemplo (reemplazar por BD en Fase 2)
    db.ts               # capa de datos (preparada, no conectada)
    schema-notes.md     # modelo de datos de referencia
public/brand/           # logos e isotipos
Assets/                 # material de marca original (fuente de verdad)
```

## Decisiones tomadas

- **Backoffice en la MISMA plataforma** (no proyecto aparte): route group `(backoffice)`,
  layout propio, protegido por rol. Comparte tipos y código con el sitio público.
- **Tres roles de usuario:** `freelancer`, `empresa`, `admin`. Solo `admin` entra al backoffice.
- **Monolito modular** (no microservicios). Se puede separar más adelante si hace falta.
- **Datos estructurados desde el día uno** para habilitar filtros y match sin migraciones.
- **Match semi-automatizado por reglas** (no IA). La IA es una etapa futura.
- Animaciones de reveal son **resilientes sin JS** (ver `components/ui/Reveal.tsx`).

## Estado por fases

- [x] **Fase 1 — Landing institucional** (pública, una página). Terminada.
- [~] **Fase 2 — CRUD, usuarios y backoffice.** Pantallas con datos mock terminadas.
      Integración de BD EN CURSO (ver abajo).
- [x] **Fase 3 — Directorio público + match semi-automatizado.** Terminada.
      Motor de matching (`src/lib/matching.ts`, ver `matching-notes.md`), directorio
      público `/red` (filtros por URL, top-5 en carrusel + grilla, tarjetas con
      avatar/score/razones), perfil individual `/red/[id]` con similares, y
      `solicitarMatchAction` que crea la solicitud con candidatos rankeados.
      Emails transaccionales (Resend) en `src/lib/email.ts`.
- [ ] **Fase 4 (futuro) — Comunidad/membresía. Luego, capa de IA.**
- Pendiente de pulido (post-funcionalidad): subida real de imágenes de portfolio
  (la foto de perfil y el logo de empresa ya suben de verdad, vía Vercel Blob —
  falta cargar `BLOB_READ_WRITE_TOKEN`, ver `TODO.md`), verificar dominio en
  Resend para mails a externos, y bugs visuales de la landing.

## Integración de base de datos (implementada)

- Schema + tablas creadas en Supabase (`prisma db push`), datos y usuarios cargados (seed).
- `src/lib/prisma.ts` (cliente), `src/lib/data.ts` (capa de datos Prisma),
  `src/lib/actions.ts` (server actions con revalidación).
- **Auth.js real** (split config): `src/auth.config.ts` (edge, middleware),
  `src/auth.ts` (Credentials + bcrypt + Prisma), `src/middleware.ts` (protege /admin y /cuenta),
  `src/app/api/auth/[...nextauth]/route.ts`. Login en `/login` con email+contraseña.
- Pantallas conectadas: dashboard, profesionales (lista+detalle), empresas (lista+detalle),
  matches — todas server components + client con server actions. `/cuenta` usa la sesión real.
  Formularios `/sumate` y `/diagnostico` persisten en la BD.
- Verificado por typecheck (stub de Prisma). Falta: `npm run build` en la máquina del
  usuario + deploy a Vercel (el sandbox no puede compilar por el bloqueo de Prisma).
- Archivos legacy sin uso (quedaron por no poder borrarlos desde el sandbox):
  `src/lib/session.ts`, `src/components/AuthGuard.tsx` — se pueden eliminar.

**GOTCHAS DE ENTORNO (importante):**
- El sandbox de Cowork tiene bloqueado `binaries.prisma.sh`, así que `prisma generate`
  / `db push` / `migrate` NO corren ahí. Se ejecutan en la máquina del usuario (red abierta).
- **Prisma lee `.env`, NO `.env.local`.** Next.js lee `.env.local`. Por eso las URLs de
  la base deben estar en `.env` (o duplicadas en ambos). Los dos están gitignored.
- Con Supabase usar **`db push`** (no `migrate dev`): el pooler no crea shadow DB.
- `DATABASE_URL` = Transaction pooler (puerto 6543, `?pgbouncer=true`).
  `DIRECT_URL` = Session pooler (puerto 5432). NO usar "Direct connection" (IPv6-only).
- Si la contraseña tiene símbolos, escaparlos en la URL (ej. `*` → `%2A`).

### Runbook (correr en la máquina del usuario, una vez)

```bash
cp .env.example .env            # completar DATABASE_URL, DIRECT_URL, AUTH_SECRET, ADMIN_*
npm install                     # postinstall corre `prisma generate`
npm run db:push                 # crea las tablas en Supabase (sin shadow DB)
npm run db:seed                 # carga datos + usuarios (admin, freelancer/empresa demo)
npm run dev
```

Admin seed por defecto: `sinnergiasistemas@gmail.com` / `ADMIN_PASSWORD` del `.env`.

## Cómo correr

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # verificar que compila antes de dar por terminado
```

## Pendientes / a iterar (anotados por el usuario)

- Hay bugs visuales menores en la landing por corregir (pendiente, no bloqueante).
- Campos de freelancer/empresa: son un primer set razonable, se iteran.
- Formularios y acciones del backoffice son **UI/mock**: no persisten hasta conectar BD.
- Auth real (login admin) pendiente para Fase 2.

## Convenciones

- Componentes con estado/interacción → `"use client"`.
- Contenido/datos de ejemplo centralizados en `src/lib/` (no hardcodear en componentes).
- Antes de cerrar una tarea: `npm run build` debe pasar sin errores.
- Español (es-AR) en toda la UI.
