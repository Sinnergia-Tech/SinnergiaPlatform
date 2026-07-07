/**
 * Compresión/redimensión de imágenes EN EL NAVEGADOR, antes de subir.
 *
 * Evita mandar fotos de celular de 8MB (que además chocan con el límite de body
 * de Server Actions) y acelera la carga en el perfil. Redimensiona al lado
 * mayor `maxDim` y re-encodea a WebP (preserva transparencia de logos). Ante
 * cualquier error o si el resultado no mejora, devuelve el archivo original.
 *
 * Usa APIs de browser → solo desde componentes cliente.
 */
export async function compressImage(
  file: File,
  { maxDim, quality = 0.85 }: { maxDim: number; quality?: number }
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const largest = Math.max(img.width, img.height);
    const scale = Math.min(1, maxDim / largest);

    // Ya es chica y liviana: no la toco.
    if (scale === 1 && file.size <= 1_000_000) return file;

    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.size >= file.size) return file; // no mejoró: quedate con el original

    return new File([blob], replaceExt(file.name, "webp"), { type: "image/webp" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function replaceExt(name: string, ext: string): string {
  return name.replace(/\.[^./\\]+$/, "") + "." + ext;
}
