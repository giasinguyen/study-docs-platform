'use client';

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
              Something went wrong
            </h1>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              An unexpected error occurred. Please try again.
            </p>

            {error.message?.includes('Supabase') && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <p style={{ color: '#991b1b', fontSize: '14px' }}>
                  Missing Supabase environment variables. Please set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                </p>
              </div>
            )}

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
              <a
                href="/"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
