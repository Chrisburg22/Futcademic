'use client';

import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/auth/AuthGate';
import { SuspendedGate } from '@/components/auth/SuspendedGate';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthGate>
        <SuspendedGate>
          <AppShell>{children}</AppShell>
        </SuspendedGate>
      </AuthGate>
    </ProtectedRoute>
  );
}
