'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ChatPage } from '@/screens/admin/ChatPage';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <ChatPage />
    </ProtectedRoute>
  );
}
