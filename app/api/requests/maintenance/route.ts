import { NextRequest, NextResponse } from 'next/server'
import { insertMaintenanceRequest, getMaintenanceRequests } from '@/lib/queries'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const isAdmin = user.role === 'admin' || user.role === 'manager'
    const data = await getMaintenanceRequests(isAdmin ? {} : { userId: user.id })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[/api/requests/maintenance] GET error:', err)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json() as { equipment_desc?: string; issue_detail?: string; urgency?: string }
    const { equipment_desc, issue_detail } = body
    if (!equipment_desc || !issue_detail) {
      return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }
    const row = await insertMaintenanceRequest({
      applicant_name: user.name,
      equipment_desc,
      issue_detail,
      urgency: body.urgency ?? 'normal',
    }, user.id)
    return NextResponse.json({ success: true, id: row.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/requests/maintenance] POST error:', err)
    return NextResponse.json({ success: false, error: '신청 실패' }, { status: 500 })
  }
}
