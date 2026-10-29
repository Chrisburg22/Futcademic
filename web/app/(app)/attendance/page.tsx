'use client';

import { Suspense } from 'react';
import { AttendancePage } from '@/screens/AttendancePage';

export default function Page() {
  return (
    // La pantalla lee categoría, fecha y periodo de la query con
    // `useSearchParams`, que necesita un límite de Suspense para prerenderizar.
    <Suspense fallback={null}>
      <AttendancePage />
    </Suspense>
  );
}
