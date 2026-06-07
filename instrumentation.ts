import * as Sentry from '@sentry/nextjs';

// Next.js 16 loads this `register()` hook once per server runtime. Without it,
// the Sentry server/edge configs are never imported and server-side errors go
// uncaptured. Each imported config no-ops when NEXT_PUBLIC_SENTRY_DSN is unset.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown in nested React Server Components / route handlers so
// they surface in Sentry with request context.
export const onRequestError = Sentry.captureRequestError;
