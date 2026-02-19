import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { setRequestLocale } from 'next-intl/server';
import '../globals.css';

export function generateStaticParams() {
  return [{ locale: 'vi' }, { locale: 'en' }];
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  try {
    const { locale } = await params;
    setRequestLocale(locale);
    
    let messages = {};
    try {
      messages = await getMessages();
    } catch (err) {
      console.error('Failed to load messages:', err);
      // Continue with empty messages
    }

    return (
      <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
        <body suppressHydrationWarning>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Layout error:', error);
    // Fallback minimal layout
    return (
      <html lang="en">
        <body>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Study Docs Platform</h1>
            <p>There was an error loading the page. Please try again.</p>
          </div>
        </body>
      </html>
    );
  }
}
