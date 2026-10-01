import { redirect } from 'next/navigation';

export default function StoreProfilePage() {
  redirect('/dashboard/settings');
}
