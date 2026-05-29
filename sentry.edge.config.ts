import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Sample 10% of traces in production to control cost. 100% in dev.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    debug: false,
  });
}
