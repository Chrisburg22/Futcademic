# E2E tests (Playwright) — Futcademic web

Per-phase end-to-end tests that exercise every feature shipped in a phase and
record a **video** of it. Runs fully offline against a **mocked backend**.

## How it works

- `playwright.config.ts` boots the app with `vite --mode test` (loads `.env.test`,
  which points Supabase at a stub host so nothing real is contacted). Video is
  recorded for every test (`video: 'on'`).
- `helpers.ts` mocks everything:
  - `loginAs(page, { profile, api, goto })` drives the **real** login form against a
    mocked GoTrue `/auth/v1/token`, so `auth-js` persists the session itself.
  - Supabase REST (`/rest/v1/users`) returns the profile fixture for `AuthContext`.
  - The Express backend (`http://localhost:3000/api/**`) is dispatched per-resource
    from the `api` fixtures (notifications are stateful so mutations reflect).
  - ⚠️ The API route is scoped to the backend origin on purpose — a bare
    `**/api/**` would also intercept vite's `/src/api/axios.ts` module and crash
    the app.

## Run

```bash
npm run test:e2e                 # all phases
npx playwright test e2e/fase0.spec.ts
bash e2e/make-video.sh fase0     # -> e2e/artifacts/fase0.mp4 (concatenated clips)
```

## Per-phase convention

- `e2e/faseN.spec.ts` — tests for that phase, using `loginAs` with the role(s)
  and `api` fixtures the phase needs.
- After running, `bash e2e/make-video.sh faseN` produces `e2e/artifacts/faseN.mp4`.
