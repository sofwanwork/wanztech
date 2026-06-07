// Next.js 16 / Sentry v10 load client-side instrumentation from this file.
// We keep the actual init in `sentry.client.config.ts` (guarded by DSN) and
// import it here so there is a single source of truth and a single init call.
import './sentry.client.config';

import * as Sentry from '@sentry/nextjs';

// Reports client-side navigation transitions to Sentry (no-ops without a DSN).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
