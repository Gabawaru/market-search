export function OumnoLogo({ size = 40, withWordmark = false }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- petit SVG statique, pas besoin de next/image */}
      <img src="/logo.svg" alt="Oumno Éducation" width={size} height={size} />
      {withWordmark && <span className="text-lg font-bold tracking-tight">Oumno Éducation</span>}
    </span>
  );
}
