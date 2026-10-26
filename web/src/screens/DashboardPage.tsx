import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { ParentDashboard } from './dashboard/ParentDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';

export function DashboardPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading || !profile) return <LoadingState />;

  const greeting = `Hola, ${profile.full_name?.split(' ')[0] || ''} 👋`;

  return (
    <>
      <PageHeader title={greeting} description="Resumen de tu academia" />
      {(profile.role === 'admin' || profile.role === 'super_admin') && <AdminDashboard />}
      {profile.role === 'profesor' && <TeacherDashboard />}
      {profile.role === 'padre' && <ParentDashboard />}
      {profile.role === 'alumno' && <StudentDashboard />}
    </>
  );
}
