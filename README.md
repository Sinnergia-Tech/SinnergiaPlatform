# Sinnergia Platform

Plataforma web de **Sinnergia Studio** — consultoría + red curada de profesionales +
match entre empresas y colaboradores.

> Definamos el QUÉ. Nosotros te explicamos el CÓMO.

Construida con **Next.js (App Router) + React + TypeScript + Tailwind CSS v4**.
Paleta estricta blanco/negro según el manual de marca. Diseño editorial, monocromático.

---

## Estado actual

**Fase 1 — Landing institucional** ✅
Sitio público de una sola página con las secciones:

- Hero
- ¿Qué problema resolvemos?
- Cómo funciona (método de 5 pasos)
- Servicios (Diagnóstico USD 150, Supervisión, Armado de Equipos)
- Red Sinnergia (teaser del directorio + perfil de ejemplo)
- Sumate a la red
- Casos & Portfolio (Problema → Diagnóstico → Solución → Resultado)
- Manifiesto
- CTA + Footer con newsletter

Las imágenes/videos son **placeholders** a reemplazar por assets reales.

**Próximas fases** (aún no iniciadas)
- Fase 2 — Backoffice, gestión de usuarios, formularios conectados y base de datos.
- Fase 3 — Directorio público con filtros y match semi-automatizado.

---

## Cómo correrlo localmente

```bash
npm install
npm run dev
# abrí http://localhost:3000
```

Otros scripts:

```bash
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # linting
```

> Nota: la tipografía **Jost** (sustituto web de Century Gothic) se carga desde
> Google Fonts. Requiere conexión a internet en el navegador.

---

## Estructura

```
src/
  app/
    layout.tsx        # layout raíz, fuente, metadata
    page.tsx          # ensambla las secciones de la landing
    globals.css       # design tokens (B/N) + utilidades
  components/
    Nav, Hero, Problema, ComoFunciona, Servicios,
    RedSinnergia, Sumate, Portfolio, Manifiesto, CTABand, Footer
    ui/               # Container, Button, Placeholder, Reveal
  lib/
    db.ts             # capa de datos (preparada, no conectada)
    schema-notes.md   # modelo de datos de referencia (Fase 2)
public/
  brand/              # logos (negro/blanco)
  placeholders/       # (vacío) para assets reales
Assets/               # material de marca original (fuente de verdad)
```

## Preparado para la Fase 2 (base de datos + hosting)

- **Variables de entorno:** copiá `.env.example` a `.env.local` y completá los valores.
- **Base de datos:** ver `src/lib/db.ts` (pasos para activar Prisma + Postgres) y
  `src/lib/schema-notes.md` (modelo de datos).
- **Hosting recomendado:** Vercel (deploy directo del repo). Base gestionada: Neon o
  Supabase. Archivos: Cloudflare R2. La app funciona igual en un VPS si más adelante
  se busca control de costos.

### Deploy a Vercel (cuando corresponda)
1. Conectar el repo de GitHub en vercel.com.
2. Framework detectado automáticamente: Next.js.
3. Cargar las variables de entorno (`DATABASE_URL`, etc.).
4. Deploy.
