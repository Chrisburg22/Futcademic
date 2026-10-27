import type { Metadata } from 'next';

/**
 * La página de inscripción vive fuera del shell autenticado y nunca debe
 * indexarse: la URL contiene un token de un solo uso.
 */
export const metadata: Metadata = {
  title: 'Inscripción · Futcademic',
  description: 'Formulario de inscripción de la academia.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  referrer: 'no-referrer',
};

export default function EnrollmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
