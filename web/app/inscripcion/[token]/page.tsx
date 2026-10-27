'use client';

import { useParams } from 'next/navigation';
import { PublicEnrollmentPage } from '@/screens/enrollment/PublicEnrollmentPage';

export default function Page() {
  const params = useParams<{ token: string }>();
  return <PublicEnrollmentPage token={params.token} />;
}
