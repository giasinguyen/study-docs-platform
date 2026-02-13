import { createNavigation } from 'next-intl/navigation';

export const locales = ['vi', 'en'] as const;
export const defaultLocale = 'vi';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale
});
