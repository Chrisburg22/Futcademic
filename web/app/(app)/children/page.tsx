'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ChildrenPage } from '@/screens/ChildrenPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['padre']}>
      <ChildrenPage />
    </ProtectedRoute>
  );
}
