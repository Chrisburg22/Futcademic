import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter } from 'react-router-dom';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import './index.css';

import App from './App';
import { theme } from './lib/theme';
import {
  queryClient,
  queryPersister,
  CACHE_MAX_AGE,
  shouldPersistQueryKey,
} from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
// Import con efecto: registra el listener de `beforeinstallprompt` antes del
// primer render, que es cuando el navegador lo dispara.
import './lib/pwaInstall';

// Cambiar de build invalida la caché persistida: evita rehidratar datos con
// una forma que el código nuevo ya no espera.
const BUILD_ID = import.meta.env.VITE_BUILD_ID ?? __APP_VERSION__;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ReloadPrompt />
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
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </PersistQueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>,
);
