// TEMPORARY verification route for Sentry. Safe by default — only throws when
// visited with `?throw=1`. Remove this folder once Sentry capture is confirmed.
export const dynamic = 'force-dynamic';

export default async function SentryTestPage({
  searchParams,
}: {
  searchParams: Promise<{ throw?: string }>;
}) {
  const sp = await searchParams;
  if (sp?.throw === '1') {
    throw new Error('KlikForm Sentry test error (server) — safe to ignore');
  }
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Sentry test route</h1>
      <p>
        Add <code>?throw=1</code> to the URL to trigger a test server error, then
        check your Sentry dashboard → Issues.
      </p>
      <p style={{ color: '#888' }}>Remove this route after verifying.</p>
    </div>
  );
}
