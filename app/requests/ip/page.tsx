import { getCurrentUser } from '@/lib/session'
import { getIPRequests } from '@/lib/queries'
import IPRequestsView from '@/components/requests/IPRequestsView'

export const dynamic = 'force-dynamic'

export default async function IPRequestPage() {
  const user = await getCurrentUser()
  const isAdmin = user.role === 'admin' || user.role === 'manager'
  const initialRows = await getIPRequests(isAdmin ? {} : { userId: user.id })
  return <IPRequestsView initialRows={initialRows} />
}
