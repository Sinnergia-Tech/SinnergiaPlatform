# Modelo de datos — notas de referencia (Fase 2)

Base recomendada: **PostgreSQL** (relacional). El diagnóstico y los atributos de
profesionales se guardan **estructurados** desde el día uno para habilitar filtros
hoy y el match semi-automatizado mañana, sin migraciones que rompan lo anterior.

## Entidades principales

| Entidad | Campos clave | Relaciones |
|---|---|---|
| `professional` | nombre, email, whatsapp, linkedin, instagram, portfolio_url, foto, descripción, experiencia (junior/semi/senior), honorarios, modalidad, disponibilidad, estado (pendiente/aprobado/rechazado/oculto), destacado | N:M con `role` y `rubro`; 1:N con `match_request` |
| `role` | nombre (Diseño, CM, Paid Media, Filmmaker, Web, Branding, Ecommerce…) | N:M con `professional` |
| `rubro` | nombre (Ecommerce, Automotriz, Salud, Eventos, Gastronomía, Industrial…) | N:M con `professional` y `company` |
| `company` | nombre, contacto, email, rubro, tamaño, origen del lead | 1:N con `diagnosis` y `match_request` |
| `diagnosis` | rubro, facturación, objetivos, presupuesto, equipo_actual, problema_principal, respuestas (JSON), estado del lead, notas | N:1 con `company` |
| `match_request` | empresa, contexto, candidatos sugeridos, puntaje, estado (solicitado/en gestión/cerrado), resultado | N:1 con `company`; N:M con `professional` |
| `admin_user` | email, rol (admin/editor), credenciales | 1:N con `audit_log` |
| `audit_log` | acción, entidad, autor, fecha | N:1 con `admin_user` |

## Principios
- `role` y `rubro` son **catálogos administrables** (no listas hardcodeadas).
- `diagnosis` guarda campos fijos + un **JSON flexible** para preguntas nuevas.
- `match_request` existe desde el modelo aunque el match arranque por reglas:
  el salto a IA cambia el cálculo del puntaje, no el esquema.
- Entidades de membresía (`member`, `subscription`, `forum_post`, `resource`) se
  suman como módulo aditivo en la fase de comunidad.
