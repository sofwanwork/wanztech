// Next.js 16 / Sentry v10 load client-side instrumentation from this file.
// When Sentry is unconfigured (e.g. local dev without DSN), we avoid loading
// the heavy Sentry bundle upfront so execution time stays well under Next.js 16ms threshold.
const hasSentry = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (hasSentry) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./sentry.client.config');
}

export const onRouterTransitionStart = hasSentry
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@sentry/nextjs').captureRouterTransitionStart
  : undefined;


