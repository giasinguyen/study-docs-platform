import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect straight to login
  redirect('/vi/login');
}
