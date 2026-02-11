import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5',
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ color: '#e11d48', marginBottom: '20px' }}>
              ⚠️ Application Error
            </h1>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Something went wrong while loading the application.
            </p>

            {error.message.includes('Supabase') && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <h3 style={{ color: '#991b1b', marginBottom: '10px' }}>
                  Missing Configuration
                </h3>
                <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '10px' }}>
                  The application is missing required Supabase environment variables.
                </p>
                <p style={{ color: '#7f1d1d', fontSize: '14px' }}>
                  Please set the following in Vercel Dashboard:
                </p>
                <ul style={{ color: '#7f1d1d', fontSize: '14px', marginTop: '10px' }}>
                  <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
                  <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                </ul>
              </div>
            )}

            <details style={{ marginBottom: '20px' }}>
              <summary style={{ cursor: 'pointer', color: '#666', marginBottom: '10px' }}>
                Error Details
              </summary>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
              }}>
                {error.message}
              </pre>
              {error.digest && (
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Error ID: {error.digest}
                </p>
              )}
            </details>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Try Again
              </button>
              <Link
                href="/"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  display: 'inline-block',
                }}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
