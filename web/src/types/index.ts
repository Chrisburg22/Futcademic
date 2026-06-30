export type Role = 'super_admin' | 'admin' | 'profesor' | 'padre' | 'alumno';

export interface School {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  school_id: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  must_change_password?: boolean;
}

export interface Category {
  id: string;
  name: string;
  birth_year: number;
  teacher_id?: string | null;
  school_id: string;
  teacher?: AppUser | null;
  students?: Student[];
}

export interface Student {
  id: string;
  full_name: string;
  birth_date: string;
  email?: string | null;
  category_id?: string | null;
  parent_id?: string | null;
  uniform_delivered?: boolean;
  phone?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_notes?: string | null;
  avatar_url?: string | null;
  category?: Category | null;
  parent?: AppUser | null;
}

export type EventType = 'entrenamiento' | 'partido';

export interface SportEvent {
  id: string;
  category_id: string;
  date: string;
  start_time?: string | null;
  type: EventType;
  description?: string | null;
  category?: Category;
}

export interface Training {
  id: string;
  event_id: string;
  category_id: string;
  date: string;
  start_time?: string | null;
  type: EventType;
  completed: boolean;
  cancelled?: boolean;
  category?: Category;
}

export interface Attendance {
  id: string;
  student_id: string;
  training_id: string;
  category_id: string;
  date: string;
  type: EventType;
  present: boolean;
  student?: Student;
}

export type PaymentType = 'mensualidad' | 'pago_profesor' | 'ingreso' | 'egreso';

export interface Payment {
  id: string;
  type: PaymentType;
  amount: number;
  payment_date: string;
  description?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  payment_month?: number | null;
  student?: Student;
  teacher?: AppUser;
}

export type StudentStatus = 'activo' | 'pendiente_pago' | 'inactivo' | 'becado';

export interface TeacherPermissions {
  can_take_attendance: boolean;
  can_manage_events: boolean;
  can_view_finances: boolean;
  can_manage_students: boolean;
  can_manage_payments: boolean;
  can_manage_categories: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address?: string | null;
  notes?: string | null;
  is_external?: boolean;
  status?: string | null;
  surface_type?: string | null;
  capacity?: number | null;
  has_lighting?: boolean;
  is_covered?: boolean;
  type_label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body?: string | null;
  type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  unlocked: boolean;
  unlocked_at?: string | null;
}

export interface AchievementsResponse {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
}

export interface AccountStatement {
  studentName: string;
  category: string | null;
  monthlyFee: number;
  pendingAmount: number;
  hasPaidThisMonth: boolean;
  totalPayments: number;
  movements: Array<{
    id: string;
    date: string;
    amount: number;
    description?: string | null;
    type?: string | null;
  }>;
}

export interface StudentStats {
  currentStreak: number;
  maxStreak: number;
  trainingsThisMonth: number;
  attendedThisMonth: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export interface Team {
  teamName: string;
  color: string | null;
  birthYear: number | null;
  teammates: Array<{ id: string; full_name: string; avatar_url?: string | null }>;
  teachers: Array<{ id: string; full_name: string; avatar_url?: string | null }>;
  schedules: Array<{ day?: string; start_time?: string; venue?: string }>;
}

export interface DeletedStudent {
  original_student_id: string;
  full_name: string;
  deleted_at: string;
  deleted_by_user?: string | null;
}
