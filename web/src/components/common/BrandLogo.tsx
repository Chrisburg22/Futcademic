/**
 * Marca de Futcademic: la "F" del icono de la PWA, en SVG para que escale y
 * tome el color del contexto (verde sobre claro, blanco sobre el panel).
 */
export function BrandLogo({
  size = 40,
  variant = 'brand',
}: {
  size?: number;
  variant?: 'brand' | 'inverted';
}) {
  const bg = variant === 'brand' ? 'var(--mantine-color-futcamedic-8)' : '#ffffff';
  const fg = variant === 'brand' ? '#ffffff' : 'var(--mantine-color-futcamedic-8)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Futcademic"
      focusable="false"
    >
      <rect width="512" height="512" rx="96" fill={bg} />
      <g fill={fg}>
        <rect x="176" y="136" width="56" height="240" rx="12" />
        <rect x="176" y="136" width="164" height="56" rx="12" />
        <rect x="176" y="234" width="128" height="52" rx="12" />
      </g>
    </svg>
  );
}
