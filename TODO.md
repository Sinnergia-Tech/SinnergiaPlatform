# TODO — Sinnergia Platform

Estado al 2026-07-03 (actualizado con la subida de fotos de perfil). Actualizar/borrar
ítems a medida que se resuelven.

## 🟡 A futuro (a definir con stakeholders)

- **Tags / "tipo de proyecto" en el modal de portfolio.** Cada proyecto podría
  llevar tags propios (ej. Filmmaker, Producción, un rubro) que se muestren en su
  modal de detalle. Falta definir el set de tags y si son por-proyecto o reusan
  las especialidades del perfil. El modal de proyecto ya existe
  (`src/components/directory/PortfolioProjects.tsx`) — solo faltaría el campo + selector.

## 🔴 Bloqueante: falta configurar Vercel Blob para que la subida de fotos funcione

**Contexto:** se implementó la subida real de foto de perfil (freelancer) y logo
(empresa) usando Vercel Blob — reemplaza los campos de texto libre que había antes
(`fotoUrl`/`logoUrl` como URL pegada a mano). El código ya está listo
(`src/lib/storage.ts`, `uploadFreelancerPhotoAction`/`uploadCompanyLogoAction` en
`src/lib/actions.ts`, componente `PhotoUploadField`), pero **sin el token no va a
funcionar** — el `.env` local no tiene `BLOB_READ_WRITE_TOKEN` todavía.

**Pasos:**
1. Vercel dashboard → tu proyecto (`sinnergia-platform`) → Storage → Create Database → Blob.
2. Conectarlo al proyecto (Vercel agrega `BLOB_READ_WRITE_TOKEN` solo en las envs de
   Vercel — Production/Preview/Development).
3. Copiar ese mismo valor a tu `.env` local para poder probarlo en `npm run dev`.
4. Probar: entrar como freelancer o empresa a `/cuenta`, subir una foto, confirmar
   que se ve en el perfil.

Plan gratis (Hobby): 1GB almacenamiento + 10GB transferencia por mes, sin costo —
de sobra para fotos de perfil. Se puede seguir usando en Pro sin cambiar nada del
código (ahí sí empieza a cobrar por uso, pero es centavos a esta escala).

## 🔴 Bloqueante ahora mismo: dominio + Resend (verificación de email)

**Contexto:** el código del flujo de verificación de email / recuperación de
contraseña ya está terminado y probado. Lo único que falta para que funcione
con usuarios reales (no solo con `sinnergiasistemas@gmail.com`) es verificar
un dominio propio en Resend.

**Estado actual:**
- Dominio `sinnergiastudio.com.ar` comprado en DonWeb.
- En proceso de acreditación de identidad ante NIC Argentina (se le pidió al
  responsable que la haga).
- El registro del dominio en sí (alta ante NIC.ar) está **"EN PROCESO"**
  (paso "Dominio activo" todavía sin completar). Tarda 24-48hs habituales,
  más si el nombre está en alguna lista negra de NIC.ar.
- Ya se agregó el dominio en Resend (Domains → sinnergiastudio.com.ar) y
  Resend mostró los registros DNS a cargar, pero todavía no se pudieron
  cargar en DonWeb porque el dominio no está activo / falta la
  acreditación de identidad.

**Próximos pasos (en orden):**
1. Esperar a que en DonWeb el dominio pase a **"Dominio activo"** (los 3
   pasos con tilde verde).
2. Entrar a la sección de DNS de DonWeb para `sinnergiastudio.com.ar`.
3. Cargar los registros que muestra Resend (Domains → sinnergiastudio.com.ar
   → "Fill in your DNS Records") — **copiar el valor completo desde Resend**,
   no de una captura de pantalla (son claves largas, se truncan al mostrarlas):
   - `TXT` — `resend._domainkey` (DKIM)
   - `MX` — `send` (prioridad 10)
   - `TXT` — `send` (SPF)
   - `TXT` — `_dmarc` (DMARC, opcional pero recomendado)
4. Volver a Resend y verificar el dominio (puede tardar de minutos a un
   par de horas en propagar).
5. Actualizar `EMAIL_FROM` en `.env`:
   ```
   EMAIL_FROM="Sinnergia Studio <hola@sinnergiastudio.com.ar>"
   ```
   (el usuario antes de la `@` puede ser cualquiera, no hace falta que sea
   una casilla real).
6. Probar el flujo real: registrarse en `/crear-cuenta` o `/sumate` con un
   email real (no `sinnergiasistemas@gmail.com`) y confirmar que llega el
   mail de verificación.
7. Cuando se despliegue a Vercel: cargar las mismas variables de entorno
   (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `RESEND_API_KEY`,
   `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL` con la URL real, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`) en Vercel → Settings → Environment Variables. El plan
   de Vercel (gratis/Hobby) no afecta el envío de mails — eso pasa por la
   API de Resend, no por Vercel.

## 🟡 Deuda conocida (no bloqueante)

- ~~"Nuevo diagnóstico" roto para empresas ya logueadas~~ — **resuelto**:
  `/diagnostico` ahora detecta la sesión (`DiagnosticoForm.tsx` +
  `addDiagnosisAction`), muestra el navbar de cuenta, oculta los campos de
  empresa/contraseña que ya no hacen falta, y agrega el `Diagnosis` a la
  `Company` existente en vez de crear una cuenta nueva. `/sumate` también
  muestra el navbar de cuenta si hay sesión (no tenía el mismo bug de
  duplicar cuenta porque no hay ningún botón que lleve ahí estando logueado).
- **Edición de perfil freelancer no implementada.** En `/cuenta`, el botón
  "Editar" del perfil está deshabilitado ("próximamente"). Relevante porque
  las cuentas creadas por `/crear-cuenta` (alta mínima) quedan con varios
  campos en blanco/default (descripción, experiencia, honorarios, etc.) que
  hoy sólo se pueden completar por este medio o pidiéndole al admin que las
  edite desde el backoffice.
- **Archivos legacy sin uso** (ya anotado en `CLAUDE.md`): `src/lib/session.ts`,
  `src/components/AuthGuard.tsx` — se pueden borrar.
- **Subida real de imágenes de portfolio** — el campo `imagenUrl` de cada ítem
  de portfolio (`PortfolioItem`) sigue siendo una URL pegada a mano, no subida
  real. La foto de perfil y el logo de empresa ya sí usan subida real (Vercel
  Blob, ver arriba) — se podría reusar `src/lib/storage.ts` para esto también.
- **Bugs visuales de la landing** — repasar que no haya quedado ninguno
  pendiente de la última ronda (hero, flechas, etc.).
- **Perfil de empresa sin vista pública todavía.** Los datos que carga la
  empresa en `/cuenta` (descripción, logo, redes, ubicación) hoy no se
  muestran en ningún lado — falta decidir y construir dónde el freelancer
  los ve cuando esa empresa lo contacta (mencionado explícitamente como
  "el día de mañana" al pedir la funcionalidad).
- **Vulnerabilidad `postcss <8.5.10` sin resolver** (moderada, XSS en output
  de stringify — `npm audit`). Viene empaquetada dentro de `next` mismo
  (`node_modules/next/node_modules/postcss`), no del Tailwind/PostCSS propio
  del proyecto. No la forcé porque `npm audit fix --force` baja `next` a la
  v9 (rotura total). Riesgo real bajo: es una herramienta de build interna
  de Next, no procesa CSS de usuarios en runtime. Se resuelve solo cuando
  Next.js publique una versión que actualice esa dependencia interna —
  revisar con `npm audit` cada tanto y actualizar `next` cuando haya una
  versión que la traiga arreglada.

## 🟡 Deuda de la última ronda (Contacto empresa → freelancer)

- **Sólo se implementó el estado `pending`.** El modelo `Contact` ya tiene
  los estados `accepted/rejected/cancelled/archived` en el enum, pero no hay
  botones ni acciones para que el freelancer acepte/rechace, ni para que la
  empresa cancele — eso quedó explícitamente para más adelante (así lo pidió
  la spec). El detalle del contacto (`/cuenta/contactos/[id]`) ya tiene un
  aviso de "próximamente" en ese lugar.
- **"Solicitar Match" (MatchRequest) fue reemplazado por "Contactar
  freelancer" (Contact) como punto de entrada desde el perfil.** El sistema
  viejo de `MatchRequest`/`MatchCandidate` sigue intacto y se seguiría
  gestionando desde `/admin/matches`, pero **ya no hay forma de crear un
  `MatchRequest` nuevo** (su único punto de creación era ese botón, que se
  quitó). Si en algún momento se necesita seguir generando matches curados
  por el admin, hay que agregar un punto de entrada nuevo (ej. manual desde
  el backoffice).
- **Sin notificación in-app fuera del badge.** Se implementó el badge de no
  leídos en "Mis contactos" (basado en `Contact.readAt`), pero no hay un
  centro de notificaciones genérico — si más adelante se necesitan avisos
  que no sean "alguien te contactó", ahí sí conviene un modelo
  `Notification` aparte.

## ✅ Ya resuelto en esta ronda (para referencia)

- Sistema completo de auth: verificación de email, recuperación de
  contraseña, hashing bcrypt, política de contraseñas, rate limiting
  (`src/lib/password.ts`, `password-policy.ts`, `tokens.ts`, `rate-limit.ts`).
- Alta rápida de cuenta en `/crear-cuenta` (freelancer/empresa) con
  selección de rol desde catálogo, validación en rojo por campo y spinner.
- Términos y condiciones (`/terminos-y-condiciones`) y política de
  privacidad (`/privacidad`), linkeadas desde el footer.
- Bug de `EMAIL_FROM` mal formado en `.env` (rompía **todos** los envíos de
  mail, no sólo verificación) — corregido y confirmado contra la API real
  de Resend.
- Hardening de seguridad: headers (`CSP`, `X-Frame-Options`, `HSTS`, etc. en
  `next.config.mjs`), segunda barrera de autorización en el layout de
  `/admin` (no depende sólo del middleware), HTML de usuario escapado en los
  templates de email (`src/lib/email.ts`), y `cookie` vulnerable fijado vía
  `overrides` en `package.json`.
  - **Ojo si tocás la CSP**: `script-src` necesita `'unsafe-eval'` en
    `next dev` (el HMR de webpack lo usa) pero NO en producción — está
    condicionado a `NODE_ENV` en `next.config.mjs`. Si sacás esa condición
    sin querer, `next dev` se rompe en silencio (la interactividad del
    cliente deja de funcionar, sin error visible salvo en la consola del
    navegador). Verificado con `next start` real que producción no lo
    necesita.
- `/red` (directorio) y `/red/[id]` ahora requieren estar logueado
  (cualquier rol). El botón de contacto sólo se muestra a empresas —
  freelancers y admin navegan en modo sólo-lectura.
- Flujo de contacto empresa → freelancer (`Contact` en el schema):
  "Contactar freelancer" en `/red/[id]` (reemplaza al viejo "Solicitar
  Match"), lista "Mis contactos" en `/cuenta/contactos` para ambos roles,
  detalle + marcado de leído para el freelancer en
  `/cuenta/contactos/[id]`, badge de no leídos en el nav, y mail de
  notificación al freelancer contactado. Ver deuda conocida arriba sobre
  qué quedó pendiente (accept/reject, y que ya no se crean `MatchRequest`
  nuevos).
- Portfolio de freelancer (`PortfolioItem` en el schema): se carga desde
  `/cuenta` y se muestra en el perfil público `/red/[id]`.
- Perfil de empresa (campos nuevos en `Company`: descripción, logo,
  redes, ubicación): se carga desde `/cuenta`, todavía sin vista pública
  (ver deuda conocida abajo).
