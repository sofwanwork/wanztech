import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rates as needed for production
  tracesSampleRate: 1,

  // Setting this option to true will print useful info to console while setting up Sentry
  debug: false,
});
