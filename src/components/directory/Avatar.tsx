/**
 * Avatar monocromático. Si hay foto la usa; si no, iniciales sobre círculo negro.
 * (Cuando esté la subida de imágenes, `fotoUrl` reemplaza las iniciales.)
 */
export function Avatar({
  name,
  fotoUrl,
  size = 56,
}: {
  name: string;
  fotoUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold tracking-wide text-paper"
    >
      {initials}
    </div>
  );
}
