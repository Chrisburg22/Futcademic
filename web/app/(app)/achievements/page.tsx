'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AchievementsPage } from '@/screens/AchievementsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['alumno', 'super_admin', 'admin']}>
      <AchievementsPage />
    </ProtectedRoute>
  );
}
