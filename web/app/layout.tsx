import type { Metadata, Viewport } from 'next';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@/styles/globals.css';

import { Providers } from '@/components/providers/Providers';
import { AuthLinkRedirect } from '@/components/auth/AuthLinkRedirect';

export const metadata: Metadata = {
  title: 'Futcademic',
  description: 'Gestión de academias de fútbol',
  applicationName: 'Futcademic',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Futcademic',
    // "default" reserva la barra de estado para el sistema. Con
    // "black-translucent" el webview arranca en y=0 y el header del AppShell
    // queda escondido debajo del reloj en la PWA instalada.
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#006d35',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>
          <AuthLinkRedirect>{children}</AuthLinkRedirect>
        </Providers>
      </body>
    </html>
  );
}
