import { redirect } from 'next/navigation';

export default function HomePage() {
  // Default: stuur door naar teamleider-view
  redirect('/teamleider');
}
