import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Redirect to login
  redirect(`/${locale}/login`);
}
