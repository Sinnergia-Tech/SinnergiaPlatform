# Sistema de Matching — diseño

Motor: `src/lib/matching.ts`. Determinístico, explicable, por reglas. Pensado para
que mañana la lógica de puntaje se reemplace por IA **sin tocar el modelo ni la UI**.

## Idea central: normalización por criterios aplicables

Sólo pesan los criterios que la empresa **efectivamente pidió**. Si no especifica
idiomas, ese factor no suma ni resta. El puntaje = (puntos ganados) / (puntos
posibles de los criterios pedidos) × 100. Así el score refleja "qué tan bien encaja
con lo que la empresa busca", no un filtro rígido — y por eso se siente inteligente.

## Factores y pesos (sobre 100)

| Factor | Peso | Cómo puntúa |
|---|---|---|
| Especialidad / Rol | 30 | cobertura de los roles pedidos |
| Rubro / industria | 16 | cobertura de rubros |
| Skills | 14 | cobertura de habilidades |
| Tecnologías | 10 | cobertura de stack/herramientas |
| Palabras clave | 8 | tokens del texto libre contra el índice del perfil |
| Seniority | 8 | exacto = 1, adyacente = 0.5 |
| Modalidad | 6 | matriz de compatibilidad (remoto/híbrido/presencial) |
| Idiomas | 4 | cobertura de idiomas |
| Presupuesto | 2 | encaja si honorarios ≤ presupuesto pedido |
| Ubicación | 2 | coincidencia (relevante en presencial/híbrido) |

Bonificaciones suaves (nudge, cap 100): `destacado` +4, `disponibilidad Inmediata` +3.

## Salida

`scoreProfessional(prof, query)` devuelve `{ score, factores[], razones[] }`:
- **score**: 0–100.
- **factores**: aporte y máximo por criterio → base para explicar el match.
- **razones**: top coincidencias legibles (ej. "Especialidad: Paid Media, Ecommerce").

`rankProfessionals(profs, query, topN=5)` filtra a **aprobados**, ordena por score y
separa `top` (los 5 más relevantes) del `resto` (seguir explorando).

## Query de match

Se arma desde:
- **Búsqueda del directorio** (filtros que elige la empresa), o
- **Diagnóstico** (`queryFromDiagnosis`): rubro + presupuesto + keywords de objetivos/problema.

## Datos que lo alimentan (Professional)

`roles`, `rubros`, `skills[]`, `tecnologias[]`, `idiomas[]`, `experiencia` (seniority),
`honorarios`, `modalidad`, `disponibilidad`, `ubicacion`. Sólo perfiles `aprobado`
entran al ranking.

## Evolución a IA (futuro)

La interfaz (`MatchQuery` → lista rankeada con `score` + `razones`) se mantiene. El
salto a IA es cambiar el cálculo interno del score (embeddings/aprendizaje de los
matches que funcionaron), reutilizando los mismos datos y la misma UI.
