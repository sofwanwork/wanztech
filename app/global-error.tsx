'use client';

// Global error boundary — catches errors that error.tsx can't, including
// failures in the root layout itself. Must render its own <html>/<body>.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111827',
          textAlign: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '9999px',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
          KlikForm encountered an error
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 448, margin: '0 0 24px' }}>
          An unexpected error occurred. Please try again — if the problem persists, contact
          support{error.digest ? ' and quote the reference below' : ''}.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '6px 12px',
              borderRadius: 6,
              margin: '0 0 24px',
            }}
          >
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
