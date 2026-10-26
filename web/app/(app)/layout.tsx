'use client';

import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/auth/AuthGate';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </ProtectedRoute>
  );
}
