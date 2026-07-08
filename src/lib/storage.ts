import { put, del } from "@vercel/blob";
import { checkImageFile } from "@/lib/image-constraints";
import { checkFeedbackFile } from "@/lib/feedback-files";

export class InvalidPhotoError extends Error {}
export class InvalidFileError extends Error {}

function validate(file: File) {
  const err = checkImageFile(file);
  if (err) throw new InvalidPhotoError(err);
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

/**
 * Sube un adjunto de una devolución. El blob es "público" pero con nombre
 * inadivinable (addRandomSuffix) y su URL NO se expone al cliente: la descarga
 * pasa por una ruta autenticada (/api/feedback/attachment/[id]).
 */
export async function uploadFeedbackFile(file: File, pathPrefix: string) {
  const err = checkFeedbackFile(file);
  if (err) throw new InvalidFileError(err);

  const safeName = (file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "archivo");
  const { url } = await put(`${pathPrefix}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return {
    url,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

/** Borra un blob por su URL (best-effort). */
export async function deleteBlobUrl(url: string) {
  if (url.includes(".public.blob.vercel-storage.com")) {
    await del(url).catch(() => {});
  }
}
