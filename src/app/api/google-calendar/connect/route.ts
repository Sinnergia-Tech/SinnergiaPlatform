import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calendarAuthorizeUrl, signState } from "@/lib/google-calendar";

/** Inicia el OAuth para conectar el calendario del estudio (solo admin). */
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/admin/calendario?error=noconfig", req.url));
  }
  return NextResponse.redirect(calendarAuthorizeUrl(signState()));
}
