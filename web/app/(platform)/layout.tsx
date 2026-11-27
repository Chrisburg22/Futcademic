'use client';

import { PlatformGate } from '@/components/platform/PlatformGate';
import { PlatformShell } from '@/components/platform/PlatformShell';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformGate>
      <PlatformShell>{children}</PlatformShell>
    </PlatformGate>
  );
}
