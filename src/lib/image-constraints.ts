/**
 * Restricciones de imágenes, compartidas por el cliente (validación previa a
 * subir, para no chocar con el límite de body de Server Actions) y el server
 * (validación real en src/lib/storage.ts). Módulo sin dependencias de servidor.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB (archivo final, ya comprimido)
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024; // 25MB (original, antes de comprimir)
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Validación del archivo FINAL que llega al server (ya comprimido). */
export function checkImageFile(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no válido. Usá JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen no puede pesar más de 4MB.";
  }
  if (file.size === 0) {
    return "El archivo está vacío.";
  }
  return null;
}

/**
 * Validación del original en el cliente ANTES de comprimir. No limitamos a 4MB
 * (comprimimos las grandes solas); solo cortamos formatos inválidos y archivos
 * absurdamente grandes para no cargar la memoria del navegador.
 */
export function checkOriginalImage(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no válido. Usá JPG, PNG o WEBP.";
  }
  if (file.size === 0) {
    return "El archivo está vacío.";
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return "La imagen es demasiado grande (máx 25MB).";
  }
  return null;
}
