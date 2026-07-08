/**
 * Restricciones de los adjuntos de las devoluciones. Compartido cliente/servidor
 * (validación previa a subir + validación real en storage.ts). Sin dependencias
 * de servidor.
 */
export const FEEDBACK_MAX_BYTES = 10 * 1024 * 1024; // 10 MB por archivo

const FEEDBACK_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const FEEDBACK_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "jpeg", "png", "webp"];

/** Aceptamos por MIME o por extensión (algunos sistemas mandan un MIME vacío). */
export function checkFeedbackFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ok = FEEDBACK_MIME.includes(file.type) || FEEDBACK_EXT.includes(ext);
  if (!ok) {
    return "Formato no permitido. Usá PDF, DOC/DOCX, XLS/XLSX, TXT o imágenes.";
  }
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > FEEDBACK_MAX_BYTES) return "El archivo no puede pesar más de 10 MB.";
  return null;
}

/** Atributo `accept` para el <input type="file">. */
export const FEEDBACK_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp";

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
