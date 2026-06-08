This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Auth, Session, and API routes

This app uses Supabase Auth for sign-up, sign-in, and session management.

- Client-side auth is handled in `src/features/auth/authService.ts`
- `src/app/api/auth/create-profile/route.ts` creates a Supabase profile record after sign-up
- `src/app/api/auth/get-profile/route.ts` reads profile data by user ID
- `src/app/api/auth/update-profile/route.ts` updates the profile record
- Protected pages are enforced by `middleware.ts` and client-side `useSessionGuard` for UX fallback

## Playwright end-to-end tests

This repository includes Playwright coverage in `tests/moodify.spec.ts`.

Run tests locally with:

```bash
npm install
npx playwright install
npm run test:e2e
```

The Playwright config is in `playwright.config.ts`; it starts a local dev server on `http://127.0.0.1:3001` and runs against `chromium` and `mobile`.

## Environment variables

Set these before running the app or tests:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
YOUTUBE_API_KEY=
```

For stable Playwright authentication tests, optionally provide a reusable test account:

```bash
PLAYWRIGHT_TEST_EMAIL=you@example.com
PLAYWRIGHT_TEST_PASSWORD=YourTestPassword123
```

When these are present, the Playwright suite will sign in with the configured account instead of creating a new user on every run.

## Deployment

The easiest way to deploy is Vercel. See the Next.js deployment docs for details.

## Notes

The app already includes auth middleware, protected routes, history and playlist persistence, and a responsive Tailwind UI with `framer-motion` animation support.
