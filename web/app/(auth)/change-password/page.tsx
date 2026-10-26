'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ChangePasswordPage } from '@/screens/auth/ChangePasswordPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <ChangePasswordPage />
    </ProtectedRoute>
  );
}
