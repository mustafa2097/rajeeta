import { redirect } from 'next/navigation';

export default function AdminAccountsRedirect() {
  redirect('/admin/doctors');
}
