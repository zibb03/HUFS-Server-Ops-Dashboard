import { getCurrentUser } from '@/lib/session'
import { getPrinterRequests } from '@/lib/queries'
import PrinterRequestsView from '@/components/requests/PrinterRequestsView'

export const dynamic = 'force-dynamic'

export default async function PrinterPage() {
  const user = await getCurrentUser()
  const isAdmin = user.role === 'admin' || user.role === 'manager'
  const initialRows = await getPrinterRequests(isAdmin ? {} : { userId: user.id })
  return <PrinterRequestsView initialRows={initialRows} />
}
