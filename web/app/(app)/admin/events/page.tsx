'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { EventsPage } from '@/screens/admin/EventsPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <EventsPage />
    </ProtectedRoute>
  );
}
