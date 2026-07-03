// Política de contraseñas compartida entre cliente y servidor.
// Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_HINT =
  "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial.";

export function isPasswordValid(password: string) {
  return PASSWORD_REGEX.test(password);
}
