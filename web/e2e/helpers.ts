import type { Page, Route } from '@playwright/test';

/**
 * Mocked auth + API harness.
 *
 * The web app authenticates through supabase-js (session persisted in
 * localStorage under `sb-<ref>-auth-token`) and talks to the Express backend via
 * axios. For E2E we:
 *   1. Seed a fake supabase session into localStorage so `getSession()` resolves
 *      offline (VITE_SUPABASE_URL=https://stub.supabase.co → ref "stub").
 *   2. Intercept `**\/rest/v1/**` (the AuthContext profile query) and `**\/auth/v1/**`.
 *   3. Intercept `**\/api/**` (the backend) with per-resource fixtures.
 */

export type Role = 'super_admin' | 'admin' | 'profesor' | 'padre' | 'alumno';

export interface ProfileFixture {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  school_id: string;
  avatar_url?: string | null;
  must_change_password?: boolean;
  school?: { name: string; logo_url: string | null } | null;
  [k: string]: unknown;
}

export interface ApiFixtures {
  notifications?: any[];
  students?: any[];
  categories?: any[];
  teachers?: any[];
  users?: any[];
  payments?: any[];
  pendingPayments?: any[];
  venues?: any[];
  events?: any[];
  trainings?: any[];
  achievements?: any;
  permissions?: any;
  dashboards?: Record<string, any>;
  /** pathname after `/api` (e.g. "/students/123/stats") -> body */
  extra?: Record<string, any>;
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.stub-signature`;
}

function buildSession(profile: ProfileFixture) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 365 * 10; // +10 years, never refreshes mid-test
  const access_token = makeJwt({
    sub: profile.id,
    email: profile.email,
    role: 'authenticated',
    aud: 'authenticated',
    exp,
  });
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: 'stub-refresh-token',
    user: {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

async function mockSupabase(page: Page, profile: ProfileFixture) {
  // AuthContext profile query: GET /rest/v1/users?select=...&id=eq.<uid> (.single())
  await page.route('**/rest/v1/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('/users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // GoTrue: token (sign-in/refresh) returns a session; logout/user benign.
  await page.route('**/auth/v1/**', async (route: Route) => {
    const url = route.request().url();
    const session = buildSession(profile);
    if (url.includes('/logout')) {
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session.user),
      });
    }
    // /token?grant_type=password and refresh -> full session
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });
}

async function mockApi(page: Page, fx: ApiFixtures) {
  const notifications: any[] = JSON.parse(JSON.stringify(fx.notifications ?? []));

  // Scope to the backend origin only — a bare `**/api/**` would also swallow the
  // vite module request for `/src/api/axios.ts` and crash the app.
  await page.route('http://localhost:3000/api/**', async (route: Route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');

    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    // --- Notifications (stateful so mutations reflect on refetch) ---
    if (path === '/notifications' && method === 'GET') return json(notifications);
    if (path === '/notifications/read-all' && method === 'PATCH') {
      notifications.forEach((n) => (n.is_read = true));
      return json({ message: 'ok' });
    }
    const readMatch = path.match(/^\/notifications\/(.+)\/read$/);
    if (readMatch && method === 'PATCH') {
      const n = notifications.find((x) => x.id === readMatch[1]);
      if (n) n.is_read = true;
      return json({ message: 'ok' });
    }

    // --- Explicit per-pathname overrides ---
    if (fx.extra && path in fx.extra) return json(fx.extra[path]);

    // --- GET resource lists ---
    if (method === 'GET') {
      if (path.startsWith('/dashboard/')) {
        const role = path.split('/')[2];
        return json(fx.dashboards?.[role] ?? {});
      }
      if (path === '/students' || path.startsWith('/students?')) return json(fx.students ?? []);
      if (path === '/students/deleted') return json([]);
      if (path.startsWith('/students/')) return json(fx.extra?.[path] ?? {});
      if (path.startsWith('/users')) return json(fx.teachers ?? fx.users ?? []);
      if (path === '/categories/mine') return json(fx.categories ?? []);
      if (path.startsWith('/categories')) return json(fx.categories ?? []);
      if (path === '/payments/pending') return json(fx.pendingPayments ?? []);
      if (path.startsWith('/payments')) return json(fx.payments ?? []);
      if (path.startsWith('/venues')) return json(fx.venues ?? []);
      if (path.startsWith('/attendances')) return json([]);
      if (path.startsWith('/events/trainings')) return json(fx.trainings ?? []);
      if (path.startsWith('/events')) return json(fx.events ?? []);
      if (path === '/achievements') return json(fx.achievements ?? { achievements: [], unlockedCount: 0, totalCount: 0 });
      if (path.startsWith('/permissions')) return json(fx.permissions ?? {});
      if (path.startsWith('/parents')) return json(fx.students ?? []);
      return json([]);
    }

    // --- Mutations: generic success ---
    return json({ message: 'ok', id: 'mock-id' });
  });
}

export interface LoginOptions {
  profile?: Partial<ProfileFixture>;
  api?: ApiFixtures;
  goto?: string;
}

const DEFAULT_PROFILE: ProfileFixture = {
  id: 'user-admin-1',
  email: 'admin@futcademic.test',
  full_name: 'Admin Demo',
  role: 'admin',
  school_id: 'school-1',
  avatar_url: null,
  school: { name: 'Academia Demo', logo_url: null },
};

/**
 * Drive the real login flow against the mocked GoTrue endpoint (auth-js persists
 * the session itself), then land authenticated. Optionally navigate to `goto`.
 */
export async function loginAs(page: Page, opts: LoginOptions = {}) {
  const profile: ProfileFixture = { ...DEFAULT_PROFILE, ...opts.profile };
  await mockSupabase(page, profile);
  await mockApi(page, opts.api ?? {});

  await page.goto('/login');
  await page.getByLabel('Correo').fill(profile.email);
  await page.getByLabel('Contraseña').fill('test-password-123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // AppShell header only renders once authenticated.
  await page.locator('header').waitFor({ state: 'visible' });

  if (opts.goto && opts.goto !== '/') {
    await page.goto(opts.goto);
  }
}
