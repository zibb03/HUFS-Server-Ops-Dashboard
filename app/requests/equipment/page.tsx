import { getCurrentUser } from '@/lib/session'
import { getEquipmentRequests } from '@/lib/queries'
import EquipmentRequestsView from '@/components/requests/EquipmentRequestsView'

export const dynamic = 'force-dynamic'

export default async function EquipmentPage() {
  const user = await getCurrentUser()
  const isAdmin = user.role === 'admin' || user.role === 'manager'
  const initialRows = await getEquipmentRequests(isAdmin ? {} : { userId: user.id })
  return <EquipmentRequestsView initialRows={initialRows} />
}
