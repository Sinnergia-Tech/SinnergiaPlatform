import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFeedbackAttachment } from "@/lib/data";

/**
 * Descarga autenticada de un adjunto de devolución. La URL del blob NO se expone:
 * se sirve por acá, verificando que sea un admin o la empresa dueña (y sólo si la
 * devolución está publicada). El archivo se hace stream desde el blob.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  const att = await getFeedbackAttachment(id);
  if (!att) return new NextResponse("No encontrado", { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isOwner =
    session.user.role === "empresa" &&
    session.user.companyId === att.feedback.companyId &&
    att.feedback.status === "published";
  if (!isAdmin && !isOwner) return new NextResponse("Prohibido", { status: 403 });

  const upstream = await fetch(att.url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Archivo no disponible", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", att.mimeType || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(att.fileName)}`
  );
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(upstream.body, { status: 200, headers });
}
