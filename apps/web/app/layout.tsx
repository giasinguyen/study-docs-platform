import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Docs Platform',
  description: 'Personal Knowledge Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
