import { requireAdmin } from '@/lib/auth/requireAdmin'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  await requireAdmin()
  return <DashboardClient />
}