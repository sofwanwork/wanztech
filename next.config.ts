import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    // unoptimized: true, // Enabled Image Optimization
  },
  async redirects() {
    return [
      {
        source: '/ecert',
        destination: '/certificates',
        permanent: true,
      },
      {
        source: '/ecert/:path*',
        destination: '/certificates/:path*',
        permanent: true,
      },
      {
        source: '/esijil',
        destination: '/certificates',
        permanent: true,
      },
      {
        source: '/esijil/:path*',
        destination: '/certificates/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    // Security: Content-Security-Policy tuned for KlikForm stack
    // (Next.js inline scripts, Google Fonts, Supabase, Sentry, BCL.my)
    const cspDirectives = [
      `default-src 'self'`,
      // Next.js requires unsafe-inline for its runtime scripts & styles
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel-scripts.com`,
      `style-src 'self' 'unsafe-inline' fonts.googleapis.com`,
      `font-src 'self' fonts.gstatic.com`,
      // Allow images from any HTTPS source (cover images, avatars, etc.)
      `img-src 'self' data: blob: https:`,
      // Allow connections to Supabase, Sentry tunnel, and BCL.my payment API
      `connect-src 'self' *.supabase.co *.supabase.in *.sentry.io wss://*.supabase.co https://bcl.my`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

const config = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});

// Temporarily disabled Sentry to debug Vercel build
export default nextConfig;
// export default config;
