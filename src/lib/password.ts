import bcrypt from "bcryptjs";

// Cost factor recomendado (OWASP) para contraseñas ingresadas por usuarios.
const ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
