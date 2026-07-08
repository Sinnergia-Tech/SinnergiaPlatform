import { Resend } from "resend";

/**
 * Envío de emails transaccionales (Resend).
 *
 * Es resiliente: si falla el envío (o falta la API key) NO rompe el flujo —
 * loguea y sigue. Así un problema de email nunca tira abajo un formulario.
 *
 * Nota: con el remitente de prueba `onboarding@resend.dev` Resend solo entrega
 * al dueño de la cuenta. Para enviar a usuarios reales, verificar un dominio y
 * setear EMAIL_FROM (ej. "Sinnergia <hola@sinnergia.studio>").
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Sinnergia Studio <onboarding@resend.dev>";
const ADMIN = process.env.ADMIN_EMAIL ?? "sinnergiasistemas@gmail.com";

/** Escapa HTML antes de interpolar datos que vienen de formularios públicos. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function send(opts: { to: string | string[]; subject: string; html: string }) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY sin configurar — se omite el envío");
    return;
  }
  const to = Array.isArray(opts.to) ? opts.to.filter(Boolean) : opts.to;
  if (Array.isArray(to) && to.length === 0) {
    console.warn("[email] sin destinatarios — se omite el envío");
    return;
  }
  try {
    await resend.emails.send({ from: FROM, ...opts, to });
  } catch (e) {
    console.error("[email] error al enviar:", e);
  }
}

/** Template monocromático simple, acorde a la marca. */
function tpl(heading: string, body: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1b1712;">
    <div style="background:#000;color:#fff;padding:28px 32px;">
      <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;">Sinnergia Studio</div>
    </div>
    <div style="padding:32px;border:1px solid #e4ddd3;border-top:none;">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px;">${heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:#4a4038;">${body}</div>
    </div>
    <div style="padding:16px 32px;font-size:11px;color:#9a9a97;">
      Definamos el QUÉ. Nosotros te explicamos el CÓMO.
    </div>
  </div>`;
}

// --- Aplicación de profesional ----------------------------------------------

export async function notifyNewApplication(p: {
  nombre: string;
  titular: string;
  email: string;
}) {
  const nombre = escapeHtml(p.nombre);
  const titular = escapeHtml(p.titular);
  const email = escapeHtml(p.email);
  await send({
    to: ADMIN,
    subject: `Nueva aplicación a la Red: ${p.nombre}`,
    html: tpl(
      "Nueva aplicación a la Red",
      `<p><strong>${nombre}</strong> — ${titular}<br>${email}</p>
       <p>Entrá al backoffice para revisar y aprobar el perfil.</p>`
    ),
  });
}

export async function sendApplicationConfirmation(p: {
  nombre: string;
  email: string;
}) {
  await send({
    to: p.email,
    subject: "Recibimos tu aplicación a la Red Sinnergia",
    html: tpl(
      `¡Gracias, ${escapeHtml(p.nombre.split(" ")[0])}!`,
      `<p>Recibimos tu aplicación a la Red Sinnergia. Vamos a revisar tu perfil y te
       escribimos. La curaduría es manual, así que puede tomar unos días.</p>`
    ),
  });
}

// --- Diagnóstico de empresa -------------------------------------------------

/**
 * Aviso a los admins de que una empresa pidió una sesión de consulta
 * (diagnóstico). Incluye TODO el formulario para que puedan evaluarlo sin entrar,
 * y el link directo al detalle en el backoffice. Se manda a todos los admins (`to`
 * es un array); si no llega ninguno, cae al ADMIN por defecto.
 */
export async function notifyNewDiagnosis(p: {
  to: string[];
  detailUrl?: string;
  company: {
    nombre: string;
    contacto: string;
    email: string;
    telefono?: string | null;
    rubro: string;
    tamano?: string | null;
    sitioWeb?: string | null;
  };
  diagnosis: {
    objetivos: string;
    presupuesto: string;
    facturacion?: string | null;
    equipoActual?: string | null;
    problemaPrincipal: string;
  };
}) {
  const to = p.to.length > 0 ? p.to : [ADMIN];
  const c = p.company;
  const d = p.diagnosis;

  const row = (label: string, value?: string | null) =>
    value
      ? `<tr>
           <td style="padding:6px 12px 6px 0;color:#9a9a97;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
           <td style="padding:6px 0;color:#1b1712;">${escapeHtml(value)}</td>
         </tr>`
      : "";

  const block = (label: string, value: string) =>
    `<div style="margin:0 0 14px;">
       <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9a9a97;margin-bottom:3px;">${escapeHtml(label)}</div>
       <div style="color:#1b1712;white-space:pre-line;">${escapeHtml(value)}</div>
     </div>`;

  await send({
    to,
    subject: `Nueva sesión de consulta: ${c.nombre}`,
    html: tpl(
      "Una empresa quiere contactarse",
      `<p><strong>${escapeHtml(c.nombre)}</strong> completó un diagnóstico y quiere
       coordinar una sesión de consulta.</p>

       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 20px;">
         ${row("Contacto", c.contacto)}
         ${row("Email", c.email)}
         ${row("Teléfono", c.telefono)}
         ${row("Rubro", c.rubro)}
         ${row("Tamaño", c.tamano)}
         ${row("Sitio web", c.sitioWeb)}
       </table>

       <div style="border-top:1px solid #e4ddd3;padding-top:16px;">
         ${block("Objetivos", d.objetivos)}
         ${block("Presupuesto", d.presupuesto)}
         ${d.facturacion ? block("Facturación", d.facturacion) : ""}
         ${d.equipoActual ? block("Equipo actual", d.equipoActual) : ""}
         ${block("Problema principal", d.problemaPrincipal)}
       </div>

       ${
         p.detailUrl
           ? `<p style="margin-top:8px;"><a href="${p.detailUrl}" style="color:#000;">Abrir en el backoffice →</a></p>`
           : `<p style="margin-top:8px;">Entrá al backoffice para gestionarlo.</p>`
       }`
    ),
  });
}

/**
 * Mensaje directo del equipo (admin) a un usuario de la plataforma. Supervisión/
 * operación — no es el flujo transaccional empresa→freelancer. El cuerpo lo
 * escribe el admin y se escapa antes de mandarlo.
 */
export async function sendAdminMessage(p: {
  to: string;
  nombre: string;
  subject: string;
  body: string;
}) {
  await send({
    to: p.to,
    subject: p.subject,
    html: tpl(
      `Hola, ${escapeHtml(p.nombre.split(" ")[0])}`,
      `<div style="white-space:pre-line;">${escapeHtml(p.body)}</div>
       <p style="color:#9a9a97;margin-top:20px;">Te escribe el equipo de Sinnergia Studio.
       Podés responder a este mail.</p>`
    ),
  });
}

/** Aviso a la empresa de que se publicó una devolución. */
export async function sendFeedbackPublished(p: {
  to: string;
  nombre: string;
  title: string;
  url: string;
}) {
  await send({
    to: p.to,
    subject: `Nueva devolución de Sinnergia: ${p.title}`,
    html: tpl(
      "Tenés una nueva devolución",
      `<p>El equipo de Sinnergia publicó una devolución para tu empresa:
       <strong>${escapeHtml(p.title)}</strong>.</p>
       <p><a href="${p.url}" style="color:#000;">Ver la devolución →</a></p>`
    ),
  });
}

export async function sendDiagnosisConfirmation(c: {
  nombre: string;
  email: string;
}) {
  await send({
    to: c.email,
    subject: "Recibimos tu diagnóstico — Sinnergia",
    html: tpl(
      "Recibimos tu diagnóstico",
      `<p>Gracias por confiar en Sinnergia. Vamos a leerlo con atención y coordinar la
       primera entrevista para definir el QUÉ juntos.</p>`
    ),
  });
}

// --- Moderación --------------------------------------------------------------

export async function sendApprovalEmail(p: { nombre: string; email: string }) {
  await send({
    to: p.email,
    subject: "Tu perfil fue aprobado — Red Sinnergia",
    html: tpl(
      `¡Bienvenido/a a la Red, ${escapeHtml(p.nombre.split(" ")[0])}!`,
      `<p>Tu perfil fue aprobado y ya está publicado en el directorio de Sinnergia.
       Cuando una empresa busque un perfil como el tuyo, vas a aparecer entre los
       candidatos.</p>`
    ),
  });
}

// --- Cuenta: verificación de email y recuperación de contraseña -------------

export async function sendVerificationEmail(p: {
  nombre: string;
  email: string;
  url: string;
}) {
  await send({
    to: p.email,
    subject: "Confirmá tu email — Sinnergia Studio",
    html: tpl(
      `Hola, ${escapeHtml(p.nombre.split(" ")[0])}`,
      `<p>Confirmá tu dirección de email para activar tu cuenta en Sinnergia.</p>
       <p><a href="${p.url}" style="color:#000;">Confirmar mi email →</a></p>
       <p style="color:#9a9a97;">Este enlace vence en 24 horas. Si no creaste esta
       cuenta, podés ignorar este mensaje.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(p: {
  nombre: string;
  email: string;
  url: string;
}) {
  await send({
    to: p.email,
    subject: "Restablecé tu contraseña — Sinnergia Studio",
    html: tpl(
      `Hola, ${escapeHtml(p.nombre.split(" ")[0])}`,
      `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
       <p><a href="${p.url}" style="color:#000;">Restablecer mi contraseña →</a></p>
       <p style="color:#9a9a97;">Este enlace vence en 1 hora. Si no pediste esto,
       podés ignorar este mensaje — tu contraseña actual sigue siendo válida.</p>`
    ),
  });
}

// --- Job diario (cron): inactividad, recordatorios, moderación --------------

export async function sendInactivityWarningEmail(p: {
  nombre: string;
  email: string;
  loginUrl: string;
}) {
  await send({
    to: p.email,
    subject: "Tu cuenta se va a ocultar por inactividad — Sinnergia",
    html: tpl(
      `Hola, ${escapeHtml(p.nombre.split(" ")[0])}`,
      `<p>Hace un tiempo que no entrás a Sinnergia. Si no iniciás sesión en los
       próximos días, tu cuenta va a dejar de ser visible para el resto por
       inactividad.</p>
       <p>Con solo volver a entrar, seguís activo — no perdés nada.</p>
       <p><a href="${p.loginUrl}" style="color:#000;">Iniciar sesión →</a></p>`
    ),
  });
}

export async function sendContactReminderEmail(p: {
  freelancerNombre: string;
  freelancerEmail: string;
  empresaNombre: string;
  url: string;
}) {
  const empresaNombre = escapeHtml(p.empresaNombre);
  await send({
    to: p.freelancerEmail,
    subject: `Tenés una solicitud de contacto sin responder — Sinnergia`,
    html: tpl(
      `Hola, ${escapeHtml(p.freelancerNombre.split(" ")[0])}`,
      `<p><strong>${empresaNombre}</strong> te contactó a través de Sinnergia y
       todavía no viste su solicitud.</p>
       <p><a href="${p.url}" style="color:#000;">Ver la solicitud →</a></p>`
    ),
  });
}

export async function sendAdminModerationDigest(p: {
  pendientes: { nombre: string; titular: string; dias: number }[];
  url: string;
}) {
  const filas = p.pendientes
    .map(
      (x) =>
        `<li><strong>${escapeHtml(x.nombre)}</strong> — ${escapeHtml(x.titular)} · hace ${x.dias} día(s)</li>`
    )
    .join("");
  await send({
    to: ADMIN,
    subject: `${p.pendientes.length} profesional(es) esperando moderación — Sinnergia`,
    html: tpl(
      "Perfiles pendientes de aprobación",
      `<p>Hay ${p.pendientes.length} perfil(es) esperando revisión hace 2 días o más:</p>
       <ul style="padding-left:18px;">${filas}</ul>
       <p><a href="${p.url}" style="color:#000;">Ir a moderación →</a></p>`
    ),
  });
}

// --- Contacto empresa → freelancer -------------------------------------------

export async function sendContactRequestEmail(p: {
  freelancerNombre: string;
  freelancerEmail: string;
  empresaNombre: string;
  empresaDescripcion?: string | null;
  empresaRubro: string;
  url: string;
}) {
  const empresaNombre = escapeHtml(p.empresaNombre);
  const empresaRubro = escapeHtml(p.empresaRubro);
  await send({
    to: p.freelancerEmail,
    subject: `Sinnergia — ${p.empresaNombre} quiere contactarte`,
    html: tpl(
      `Hola, ${escapeHtml(p.freelancerNombre.split(" ")[0])}`,
      `<p><strong>${empresaNombre}</strong> (${empresaRubro}) está interesada en tu perfil
       y quiere contactarte a través de Sinnergia.</p>
       ${p.empresaDescripcion ? `<p style="color:#4a4038;">${escapeHtml(p.empresaDescripcion)}</p>` : ""}
       <p><a href="${p.url}" style="color:#000;">Ver solicitud →</a></p>`
    ),
  });
}
