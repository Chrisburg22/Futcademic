'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { theme } from '@/lib/theme';
import {
  queryClient,
  queryPersister,
  CACHE_MAX_AGE,
  shouldPersistQueryKey,
} from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
// Import con efecto: registra el listener de `beforeinstallprompt` antes del
// primer render, que es cuando el navegador lo dispara.
import '@/lib/pwaInstall';
// Import con efecto: dayjs necesita `customParseFormat` para respetar el
// `valueFormat` de los DateInput (DD/MM/YYYY) al parsear lo que escribe la
// persona.
import '@/lib/dates';

// Cambiar de build invalida la caché persistida: evita rehidratar datos con
// una forma que el código nuevo ya no espera.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: CACHE_MAX_AGE,
            buster: BUILD_ID,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                query.state.status === 'success' && shouldPersistQueryKey(query.queryKey),
            },
          }}
        >
          <AuthProvider>{children}</AuthProvider>
        </PersistQueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
