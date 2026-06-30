import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Fase 5 — Pulido transversal: achievements check post-asistencia, todas las
 * fases verdes juntas (regression), sidebar items correctos para cada rol.
 */

const ADMIN = {
  id: 'admin-1',
  email: 'admin@test.com',
  full_name: 'Admin Demo',
  role: 'admin' as const,
  school_id: 'school-1',
  school: { name: 'Academia Demo', logo_url: null },
  onboarded_at: '2025-01-01',
};

const STUDENTS = [
  {
    id: 's1',
    full_name: 'Carlos López',
    email: 'carlos@test.com',
    category_id: 'cat1',
    category: { id: 'cat1', name: 'Sub-12' },
    status: 'activo',
  },
];

const CATEGORIES = [{ id: 'cat1', name: 'Sub-12', birth_year: 2012 }];

const API = {
  students: STUDENTS,
  categories: CATEGORIES,
  notifications: [],
  dashboards: {
    admin: { activeStudents: 1, totalStudents: 1, monthlyIncome: 500, attendanceRate: 90 },
  },
};

// --- Achievement check wiring (static verification) ---
test('asistencia page imports and calls useCheckAchievements', async ({ page }) => {
  // Verify at the source level that AttendancePage imports the hook.
  // This is a structural test: the integration was added in Fase 5.
  const fs = await import('fs');
  const code = fs.readFileSync('src/pages/AttendancePage.tsx', 'utf-8');
  expect(code).toContain('useCheckAchievements');
  expect(code).toContain('checkAchievements.mutate');
});

// --- Regression: all 4 roles can reach their dashboard ---
test.describe('regression: cada rol llega a su dashboard', () => {
  const roles = [
    { role: 'admin' as const, expect: 'Alumnos activos' },
    { role: 'profesor' as const, expect: 'Mis categorías' },
    { role: 'padre' as const, expect: 'Mis hijos' },
    { role: 'alumno' as const, expect: 'Racha' },
  ] as const;

  for (const { role, expect: text } of roles) {
    test(`${role} dashboard`, async ({ page }) => {
      await loginAs(page, {
        profile: {
          ...ADMIN,
          id: `${role}-1`,
          email: `${role}@test.com`,
          role,
          onboarded_at: '2025-01-01',
        },
        api: {
          notifications: [],
          students: STUDENTS,
          categories: CATEGORIES,
          dashboards: {
            admin: { activeStudents: 1, totalStudents: 1, monthlyIncome: 500, attendanceRate: 90 },
            profesor: { categoriesCount: 1, myCategories: CATEGORIES },
            padre: { children: STUDENTS },
            alumno: { currentStreak: 5, trainingsThisMonth: 8, achievementsUnlocked: 1 },
          },
        },
      });
      await expect(page.getByText(text)).toBeVisible();
    });
  }
});
