import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware edge-safe: protege /admin y /cuenta leyendo el JWT.
export default NextAuth(authConfig).auth;

export const config = {
  // Corre en las rutas privadas (evita assets y la API de auth)
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
