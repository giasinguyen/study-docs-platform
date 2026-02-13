import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  try {
    const { locale } = await params;
    setRequestLocale(locale);
    
    // Check if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
    if (!hasSupabase) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1>🚀 Study Docs Platform</h1>
          <p style={{ maxWidth: '600px', margin: '20px auto', color: '#666' }}>
            Welcome! The application is deployed but needs environment variables to be configured.
          </p>
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', maxWidth: '700px', margin: '20px auto', textAlign: 'left' }}>
            <h3>⚙️ Setup Required</h3>
            <p>Please add these environment variables in your Vercel project settings:</p>
            <ul style={{ textAlign: 'left' }}>
              <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
            </ul>
            <p style={{ marginTop: '15px', fontSize: '14px' }}>
              Go to: <strong>Vercel Dashboard → Your Project → Settings → Environment Variables</strong>
            </p>
          </div>
        </div>
      );
    }
    
    // If configured, show landing page
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>📚 Study Docs Platform</h1>
        <p>Personal Knowledge Management System</p>
        <div style={{ marginTop: '30px' }}>
          <Link 
            href={`/${locale}/login`}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Get Started →
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    // Fallback for any errors
    console.error('Error rendering home page:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>📚 Study Docs Platform</h1>
        <p>Loading...</p>
      </div>
    );
  }
}
