import { getCurrentUser } from '@/lib/session'
import { getMaintenanceRequests } from '@/lib/queries'
import MaintenanceRequestsView from '@/components/requests/MaintenanceRequestsView'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const user = await getCurrentUser()
  const isAdmin = user.role === 'admin' || user.role === 'manager'
  const initialRows = await getMaintenanceRequests(isAdmin ? {} : { userId: user.id })
  return <MaintenanceRequestsView initialRows={initialRows} />
}
