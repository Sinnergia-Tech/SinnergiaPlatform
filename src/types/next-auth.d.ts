import { DefaultSession } from "next-auth";
import { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      professionalId?: string | null;
      companyId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    professionalId?: string | null;
    companyId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    professionalId?: string | null;
    companyId?: string | null;
  }
}
