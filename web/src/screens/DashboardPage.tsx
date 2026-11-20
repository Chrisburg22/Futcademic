'use client';

import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { ParentDashboard } from './dashboard/ParentDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';
import type { Role } from '../types';

/**
 * Los cuatro roles compartían la descripción «Resumen de tu academia», que a un
 * alumno o a un padre no les dice nada: ellos no tienen una academia, tienen un
 * entrenamiento y una mensualidad.
 */
const DESCRIPCION: Record<Role, string> = {
  super_admin: 'Resumen de tu academia',
  admin: 'Resumen de tu academia',
  profesor: 'Tus categorías y lo que toca hoy',
  padre: 'Cómo van tus hijos y qué falta pagar',
  alumno: 'Lo que viene y cómo vas',
};

export function DashboardPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading || !profile) return <LoadingState />;

  const nombre = profile.full_name?.split(' ')[0];

  return (
    <>
      <PageHeader
        title={nombre ? `Hola, ${nombre}` : 'Hola'}
        description={DESCRIPCION[profile.role]}
      />
      {(profile.role === 'admin' || profile.role === 'super_admin') && <AdminDashboard />}
      {profile.role === 'profesor' && <TeacherDashboard />}
      {profile.role === 'padre' && <ParentDashboard />}
      {profile.role === 'alumno' && <StudentDashboard />}
    </>
  );
}
