import { NextResponse } from "next/server";
import { auth } from "@/auth";
import * as data from "@/lib/data";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForTokens, getConnectedEmail, verifyState } from "@/lib/google-calendar";

/** Callback del OAuth de calendario: guarda el refresh token (cifrado). */
export async function GET(req: Request) {
  const session = await auth();
  const back = (q: string) => NextResponse.redirect(new URL(`/admin/calendario${q}`, req.url));

  if (session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("error")) return back("?error=denied");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !verifyState(state)) return back("?error=state");

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google no devolvió refresh_token (suele pasar si ya se consintió antes
      // sin prompt=consent). Pedimos reconectar para forzarlo.
      return back("?error=norefresh");
    }
    const email = (await getConnectedEmail(tokens.access_token)) ?? "cuenta de Google";
    await data.saveCalendarConnection({
      email,
      refreshToken: encryptSecret(tokens.refresh_token),
      connectedById: session.user.id,
    });
    return back("?connected=1");
  } catch (e) {
    console.error("[google-calendar] callback error:", e);
    return back("?error=exchange");
  }
}
