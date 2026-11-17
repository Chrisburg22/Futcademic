'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AttendancePage } from '@/screens/AttendancePage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin', 'profesor', 'padre', 'alumno']}>
      {/* La pantalla lee categoría, fecha y periodo de la query —y el padre su
          `?student_id=`— con `useSearchParams`, que necesita un límite de
          Suspense para poder prerenderizar la ruta. */}
      <Suspense fallback={null}>
        <AttendancePage />
      </Suspense>
    </ProtectedRoute>
  );
}
