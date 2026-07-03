import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export class InvalidPhotoError extends Error {}

function validate(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new InvalidPhotoError("Formato no válido. Usá JPG, PNG o WEBP.");
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidPhotoError("La imagen no puede pesar más de 4MB.");
  }
  if (file.size === 0) {
    throw new InvalidPhotoError("El archivo está vacío.");
  }
}

/**
 * Sube una foto de perfil (freelancer o logo de empresa) y borra la anterior
 * si había una. El nombre del archivo nunca viene del usuario — se arma acá
 * a partir del id de la entidad, para no depender de un filename hostil.
 */
export async function uploadProfilePhoto(
  file: File,
  pathPrefix: string,
  previousUrl?: string | null
) {
  validate(file);

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const { url } = await put(`${pathPrefix}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  if (previousUrl && previousUrl.includes(".public.blob.vercel-storage.com")) {
    // Best-effort: si falla el borrado del blob viejo, no rompemos el flujo.
    await del(previousUrl).catch(() => {});
  }

  return url;
}
