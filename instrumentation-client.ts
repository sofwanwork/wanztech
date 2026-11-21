// Next.js 16 / Sentry v10 load client-side instrumentation from this file.
// Defer Sentry initialization off the critical pre-hydration path so this hook
// stays well under Next.js's 16ms budget in both development and production.
const shouldInitSentry =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  (process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === 'true');

let captureTransition: ((href: string, navigationType: string) => void) | null = null;

if (shouldInitSentry && typeof window !== 'undefined') {
  const bootSentry = () => {
    void Promise.all([import('./sentry.client.config'), import('@sentry/nextjs')]).then(
      ([, Sentry]) => {
        captureTransition = Sentry.captureRouterTransitionStart;
      }
    );
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(bootSentry, { timeout: 2000 });
  } else {
    setTimeout(bootSentry, 0);
  }
}

export function onRouterTransitionStart(href: string, navigationType: string): void {
  captureTransition?.(href, navigationType);
}
